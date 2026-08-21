import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ActiveTrip,
  ALL_SYSTEM_PERMISSIONS,
  AnalyticsEvent,
  AppPermission,
  DriverState,
  FirestoreCollections,
  FirestoreEssentialCore,
  LuandaLocation,
  PostgresTables,
  PrimaryAppState,
  PrivilegeEscalationState,
  SecondaryAppState,
  ShellViewMode,
  TripCategory,
  UserIdentityProfile,
  UserRole
} from '../types/architecture';
import {
  DynamicPricingConfig,
  ManagedUserCredential,
  OperationalTripPlan
} from '../types/intentTypes';
import { INITIAL_DRIVERS, LUANDA_LOCATIONS, TRIP_CATEGORIES } from '../data/luandaData';
import {
  DEFAULT_DYNAMIC_PRICING,
  FREQUENT_LOCATIONS,
  INITIAL_MANAGED_CREDENTIALS
} from '../data/contextMemoryData';
import { PRESET_IDENTITIES } from '../data/unifiedShellData';
import { calculateDriverScore, calculateHaversineDistanceKm } from '../utils/geohashUtils';

interface MatchingCandidate {
  driver: DriverState;
  distanceKm: number;
  etaMins: number;
  score: number;
  breakdown: Record<string, number>;
}

interface SystemContextType {
  activeTab: 'shell' | 'simulator' | 'constitution' | 'matching' | 'topology' | 'database' | 'api' | 'design' | 'analytics';
  setActiveTab: (tab: SystemContextType['activeTab']) => void;
  // Shell View Modes & FSM
  shellMode: ShellViewMode;
  setShellMode: (mode: ShellViewMode) => void;
  primaryState: PrimaryAppState;
  secondaryState: SecondaryAppState;
  userRole: UserRole;
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  masterFocusPhone: 'all' | 'passenger' | 'driver' | 'ops';
  setMasterFocusPhone: (focus: 'all' | 'passenger' | 'driver' | 'ops') => void;
  firestoreCore: FirestoreEssentialCore;
  startDemoCycle: () => void;
  masterUnlocked: boolean;
  triggerDialpadOpen: boolean;
  setTriggerDialpadOpen: (open: boolean) => void;
  driverAuthModalOpen: boolean;
  setDriverAuthModalOpen: (open: boolean) => void;
  masterAuthModalOpen: boolean;
  setMasterAuthModalOpen: (open: boolean) => void;
  submitDialpadCode: (code: string) => boolean;
  authenticateMaster: (method?: 'firebase_auth' | 'biometric') => boolean;
  authenticateDriver: (pin: string, useBiometrics?: boolean) => { success: boolean; error?: string };
  lockAndReturnToPublic: () => void;
  // V2 Shell & Capability State
  currentIdentity: UserIdentityProfile;
  activePermissions: AppPermission[];
  escalationSession: PrivilegeEscalationState;
  hiddenEntryModalOpen: boolean;
  setHiddenEntryModalOpen: (open: boolean) => void;
  switchIdentity: (profile: UserIdentityProfile) => void;
  togglePermission: (permission: AppPermission) => void;
  hasPermission: (permission: AppPermission) => boolean;
  escalatePrivileges: (method: PrivilegeEscalationState['method']) => void;
  terminateEscalationSession: (reason?: string) => void;
  // Dynamic Pricing & Credential Management
  pricingConfig: DynamicPricingConfig;
  updatePricingConfig: (updates: Partial<DynamicPricingConfig>) => void;
  managedCredentials: ManagedUserCredential[];
  updateUserCredential: (id: string, updates: Partial<ManagedUserCredential>) => void;
  blockUserCredential: (id: string, reason?: string) => void;
  unblockUserCredential: (id: string) => void;
  removeUserCredential: (id: string) => void;
  // Mobility & Simulation State
  passengerGpsLocation: LuandaLocation;
  setPassengerGpsLocation: (loc: LuandaLocation) => void;
  drivers: DriverState[];
  selectedOrigin: LuandaLocation;
  setSelectedOrigin: (loc: LuandaLocation) => void;
  selectedDestination: LuandaLocation;
  setSelectedDestination: (loc: LuandaLocation) => void;
  selectedCategory: TripCategory;
  setSelectedCategory: (cat: TripCategory) => void;
  activeTrip: ActiveTrip | null;
  passengerWalletAOA: number;
  currentCandidates: MatchingCandidate[];
  lastMatchingLatencyMs: number;
  analyticsEvents: AnalyticsEvent[];
  firestoreData: FirestoreCollections;
  postgresData: PostgresTables;
  driverInviteActive: boolean;
  driverInviteCountdown: number;
  requestTrip: (paymentMethod: ActiveTrip['paymentMethod']) => void;
  requestIntentTrip: (
    plan: OperationalTripPlan,
    paymentMethod: ActiveTrip['paymentMethod'],
    paymentTier?: 'TIER_1_INVISIBLE' | 'TIER_2_REFERENCE' | 'TIER_3_MANUAL'
  ) => void;
  updateLiveDestination: (refinedCoord: { lat: number; lng: number }, name?: string) => void;
  acceptTripAsDriver: () => void;
  driverArrivedAtPickup: () => void;
  startTripProgression: () => void;
  finishTrip: () => void;
  rateTrip: (stars: number, comment: string) => void;
  cancelTrip: () => void;
  toggleDriverOnline: (driverId: string) => void;
  updateDriverGpsSpeed: (driverId: string, speedKmH: number) => void;
  resetSimulation: () => void;
  emitAnalyticsEvent: (eventName: AnalyticsEvent['eventName'], payload: Record<string, any>) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<SystemContextType['activeTab']>('shell');
  
  // Single App Shell State (Public Smartphone vs Driver Cockpit vs Master 3-Phone Ecosystem)
  const [shellMode, setShellMode] = useState<ShellViewMode>('public_passenger');
  const [primaryState, setPrimaryState] = useState<PrimaryAppState>('PUBLIC');
  const [secondaryState, setSecondaryState] = useState<SecondaryAppState>('AUTHENTICATED');
  const [userRole, setUserRole] = useState<UserRole>('PASSENGER');
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [masterFocusPhone, setMasterFocusPhone] = useState<'all' | 'passenger' | 'driver' | 'ops'>('all');
  const [masterUnlocked, setMasterUnlocked] = useState<boolean>(false);
  const [triggerDialpadOpen, setTriggerDialpadOpen] = useState<boolean>(false);
  const [driverAuthModalOpen, setDriverAuthModalOpen] = useState<boolean>(false);
  const [masterAuthModalOpen, setMasterAuthModalOpen] = useState<boolean>(false);

  // Essential 7 Firestore Collections (Chapter 4.6 & 4.7)
  const [firestoreCore, setFirestoreCore] = useState<FirestoreEssentialCore>({
    users: {
      'usr_p1': { uid: 'usr_p1', role: 'PASSENGER', name: 'Domingos Neto', phone: '+244 923 100 200', rating: 4.9, walletAOA: 35000 },
      'usr_d1': { uid: 'usr_d1', role: 'DRIVER', name: 'Manuel Sebastião', phone: '+244 923 456 789', rating: 4.95, walletAOA: 42500 },
      'usr_m1': { uid: 'usr_m1', role: 'MASTER', name: 'Kizua Muanza (Fundador)', phone: '+244 912 000 001', rating: 5.0, walletAOA: 120000 }
    },
    drivers: {
      'drv_manuel_01': { id: 'drv_manuel_01', name: 'Manuel Sebastião', status: 'online', geohash: 'kr7b1v', lat: -8.8235, lng: 13.2360, rating: 4.95, balanceAOA: 42500, vehiclePlate: 'LD-42-89-HZ' },
      'drv_antonio_02': { id: 'drv_antonio_02', name: 'António Kiala', status: 'online', geohash: 'kr7b1r', lat: -8.8180, lng: 13.2420, rating: 4.88, balanceAOA: 28000, vehiclePlate: 'LD-19-44-AB' },
      'drv_esmeralda_03': { id: 'drv_esmeralda_03', name: 'Esmeralda Luísa', status: 'online', geohash: 'kr7b0d', lat: -8.8500, lng: 13.2350, rating: 4.92, balanceAOA: 63400, vehiclePlate: 'LD-77-31-XP' }
    },
    rides: {},
    vehicles: {
      'veh_01': { id: 'veh_01', driverId: 'drv_manuel_01', makeModel: 'Hyundai i10 Grand', plate: 'LD-42-89-HZ', year: 2023, color: 'Branco', verified: true },
      'veh_02': { id: 'veh_02', driverId: 'drv_antonio_02', makeModel: 'Toyota Corolla', plate: 'LD-19-44-AB', year: 2021, color: 'Prata', verified: true }
    },
    transactions: {
      'tx_init_01': { id: 'tx_init_01', rideId: 'ride_seed_0', fromUid: 'usr_p1', toUid: 'usr_d1', amountAOA: 3200, commissionAOA: 480, method: 'MULTICAIXA_EXPRESS', timestamp: Date.now() - 3600000 }
    },
    locations: {
      'loc_aeroporto': { id: 'loc_aeroporto', name: 'Aeroporto 4 de Fevereiro', neighborhood: 'Maianga', geohash: 'kr7b1v', lat: -8.8584, lng: 13.2312 },
      'loc_marginal': { id: 'loc_marginal', name: 'Marginal de Luanda', neighborhood: 'Ingombota', geohash: 'kr7b1r', lat: -8.8095, lng: 13.2343 },
      'loc_talatona': { id: 'loc_talatona', name: 'Talatona Shopping', neighborhood: 'Talatona', geohash: 'kr78pp', lat: -8.9142, lng: 13.1852 }
    },
    settings: {
      commissionRate: 0.15,
      baseFareAOA: 500,
      perKmFareAOA: 250,
      maxSearchRadiusKm: 5.0,
      demoModeEnabled: true
    }
  });

  // Dynamic Pricing Configuration (Stored dynamically, adjustable in real-time)
  const [pricingConfig, setPricingConfig] = useState<DynamicPricingConfig>(DEFAULT_DYNAMIC_PRICING);

  // Managed User Credentials (Superadmin control for block/incident response/PINs)
  const [managedCredentials, setManagedCredentials] = useState<ManagedUserCredential[]>(INITIAL_MANAGED_CREDENTIALS);

  // Passenger Context GPS (Current physical location - not forced as origin/destination)
  const [passengerGpsLocation, setPassengerGpsLocation] = useState<LuandaLocation>(FREQUENT_LOCATIONS.trabalho_talatona);

  // V2 Shell & Identity state
  const [currentIdentity, setCurrentIdentity] = useState<UserIdentityProfile>(PRESET_IDENTITIES[1]); // Domingos Neto (Passenger)
  const [activePermissions, setActivePermissions] = useState<AppPermission[]>(PRESET_IDENTITIES[1].defaultPermissions);
  const [hiddenEntryModalOpen, setHiddenEntryModalOpen] = useState<boolean>(false);
  const [escalationSession, setEscalationSession] = useState<PrivilegeEscalationState>({
    isActive: false,
    timeoutSecondsTotal: 60,
    remainingSeconds: 60,
    method: 'biometric_challenge'
  });

  const [drivers, setDrivers] = useState<DriverState[]>(INITIAL_DRIVERS);
  const [selectedOrigin, setSelectedOrigin] = useState<LuandaLocation>(LUANDA_LOCATIONS[0]); // Aeroporto
  const [selectedDestination, setSelectedDestination] = useState<LuandaLocation>(LUANDA_LOCATIONS[1]); // Marginal
  const [selectedCategory, setSelectedCategory] = useState<TripCategory>(TRIP_CATEGORIES[0]);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [passengerWalletAOA, setPassengerWalletAOA] = useState<number>(35000);
  const [currentCandidates, setCurrentCandidates] = useState<MatchingCandidate[]>([]);
  const [lastMatchingLatencyMs, setLastMatchingLatencyMs] = useState<number>(24.8);
  const [driverInviteActive, setDriverInviteActive] = useState<boolean>(false);
  const [driverInviteCountdown, setDriverInviteCountdown] = useState<number>(15);

  const updatePricingConfig = (updates: Partial<DynamicPricingConfig>) => {
    setPricingConfig((prev) => ({ ...prev, ...updates }));
    emitAnalyticsEvent('wallet_updated', {
      action: 'pricing_config_updated_by_admin',
      updates
    });
  };

  const updateUserCredential = (id: string, updates: Partial<ManagedUserCredential>) => {
    setManagedCredentials((prev) =>
      prev.map((cred) =>
        cred.id === id ? { ...cred, ...updates, updatedAt: new Date().toISOString() } : cred
      )
    );
  };

  const blockUserCredential = (id: string, reason: string = 'Incidente operacional sob averiguação') => {
    setManagedCredentials((prev) =>
      prev.map((cred) =>
        cred.id === id
          ? { ...cred, status: 'blocked', blockedReason: reason, updatedAt: new Date().toISOString() }
          : cred
      )
    );
    // If blocked driver is active, take them offline
    setDrivers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'offline' } : d))
    );
    emitAnalyticsEvent('privilege_revoked', {
      action: 'user_credential_blocked_by_superadmin',
      targetId: id,
      reason
    });
  };

  const unblockUserCredential = (id: string) => {
    setManagedCredentials((prev) =>
      prev.map((cred) =>
        cred.id === id
          ? { ...cred, status: 'active', blockedReason: undefined, updatedAt: new Date().toISOString() }
          : cred
      )
    );
  };

  const removeUserCredential = (id: string) => {
    setManagedCredentials((prev) => prev.filter((cred) => cred.id !== id));
    setDrivers((prev) => prev.filter((d) => d.id !== id));
  };

  // Firestore Realtime Collections (Chapter 12)
  const [firestoreData, setFirestoreData] = useState<FirestoreCollections>({
    drivers_online: {
      'drv_manuel_01': { status: 'online', geohash: 'kr7b1v', lastUpdate: new Date().toISOString() },
      'drv_antonio_02': { status: 'online', geohash: 'kr7b1r', lastUpdate: new Date().toISOString() },
      'drv_esmeralda_03': { status: 'online', geohash: 'kr7b0d', lastUpdate: new Date().toISOString() },
      'drv_joao_04': { status: 'online', geohash: 'kr78pp', lastUpdate: new Date().toISOString() }
    },
    driver_locations: {
      'drv_manuel_01': { lat: -8.8235, lng: 13.2360, heading: 45, speed: 22 },
      'drv_antonio_02': { lat: -8.8180, lng: 13.2420, heading: 120, speed: 18 },
      'drv_esmeralda_03': { lat: -8.8500, lng: 13.2350, heading: 180, speed: 34 },
      'drv_joao_04': { lat: -8.9100, lng: 13.1850, heading: 270, speed: 0 }
    },
    trip_requests: {},
    active_trips: {},
    presence: {
      'usr_passenger_01': { online: true, lastSeen: new Date().toISOString() },
      'drv_manuel_01': { online: true, lastSeen: new Date().toISOString() }
    }
  });

  // PostgreSQL Permanent Tables (Chapter 12)
  const [postgresData, setPostgresData] = useState<PostgresTables>({
    users: [
      { id: 'usr_p1', name: 'Domingos Neto', phone: '+244 923 100 200', email: 'domingos.neto@gmail.com', firebase_uid: 'fb_uid_domingos_99', created_at: '2026-08-01 10:00:00' },
      { id: 'usr_d1', name: 'Manuel Sebastião', phone: '+244 923 456 789', email: 'manuel.sebastiao@gobroaao.com', firebase_uid: 'fb_uid_manuel_01', created_at: '2026-07-15 08:30:00' }
    ],
    drivers: [
      { id: 'drv_manuel_01', user_id: 'usr_d1', vehicle_plate: 'LD-42-89-HZ', vehicle_model: 'Hyundai i10 Grand', cnh: 'AO-CNH-883921-B', status: 'approved', documents_verified: true }
    ],
    trips: [],
    payments: [],
    wallet: [
      { id: 'wal_p1', user_id: 'usr_p1', balance: 35000, currency: 'AOA', updated_at: new Date().toISOString() },
      { id: 'wal_d1', user_id: 'usr_d1', balance: 48500, currency: 'AOA', updated_at: new Date().toISOString() }
    ],
    ratings: []
  });

  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([
    {
      id: 'evt_init_01',
      eventName: 'app_opened',
      timestamp: new Date().toLocaleTimeString(),
      payload: { platform: 'Flutter_Android', version: '1.0.0+1', userId: 'usr_p1', osVersion: 'Android 14' }
    }
  ]);

  const emitAnalyticsEvent = (eventName: AnalyticsEvent['eventName'], payload: Record<string, any>) => {
    const newEvent: AnalyticsEvent = {
      id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      eventName,
      timestamp: new Date().toLocaleTimeString(),
      payload
    };
    setAnalyticsEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
  };

  // Driver invite countdown ticker
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (driverInviteActive && driverInviteCountdown > 0) {
      timer = setTimeout(() => {
        setDriverInviteCountdown((c) => c - 1);
      }, 1000);
    } else if (driverInviteActive && driverInviteCountdown === 0) {
      setDriverInviteActive(false);
      // If driver didn't accept, pass to candidate #2
    }
    return () => clearTimeout(timer);
  }, [driverInviteActive, driverInviteCountdown]);

  // Request Trip (Fluxo B: Step 1 & 2)
  const requestTrip = (paymentMethod: ActiveTrip['paymentMethod']) => {
    const distanceKm = calculateHaversineDistanceKm(
      selectedOrigin.lat,
      selectedOrigin.lng,
      selectedDestination.lat,
      selectedDestination.lng
    );

    const priceAOA = Math.round(
      (selectedCategory.basePriceAOA + distanceKm * selectedCategory.pricePerKmAOA) * selectedCategory.multiplier
    );
    const durationMins = Math.round(distanceKm * 2.8 + 4);

    const tripId = `trip_${Date.now().toString().slice(-6)}`;

    // Matching Engine in-memory calculation (Stateless, SLA < 100ms)
    const startMatchTime = performance.now();

    const candidates: MatchingCandidate[] = drivers
      .filter((d) => d.status === 'online')
      .map((d) => {
        const dDist = calculateHaversineDistanceKm(selectedOrigin.lat, selectedOrigin.lng, d.lat, d.lng);
        const dEta = Math.round(dDist * 2.5 + 2);
        const scoreResult = calculateDriverScore({
          distanceKm: dDist,
          driverRating: d.rating,
          etaMinutes: dEta,
          speedKmH: d.speedKmH
        });
        return {
          driver: d,
          distanceKm: dDist,
          etaMins: dEta,
          score: scoreResult.score,
          breakdown: scoreResult.weights
        };
      })
      .sort((a, b) => b.score - a.score);

    const matchDuration = Number((performance.now() - startMatchTime + 18).toFixed(1));
    setLastMatchingLatencyMs(matchDuration);
    setCurrentCandidates(candidates);

    const newTrip: ActiveTrip = {
      id: tripId,
      passengerId: 'usr_p1',
      passengerName: 'Domingos Neto',
      passengerPhone: '+244 923 100 200',
      origin: selectedOrigin,
      destination: selectedDestination,
      category: selectedCategory,
      distanceKm,
      durationMins,
      priceAOA,
      status: 'requesting',
      paymentMethod,
      paymentStatus: 'pending',
      matchingDurationMs: matchDuration,
      requestedAt: Date.now(),
      routeCoordinates: [
        [selectedOrigin.lat, selectedOrigin.lng],
        [
          (selectedOrigin.lat + selectedDestination.lat) / 2 + 0.005,
          (selectedOrigin.lng + selectedDestination.lng) / 2 - 0.004
        ],
        [selectedDestination.lat, selectedDestination.lng]
      ]
    };

    setActiveTrip(newTrip);

    // Update Firestore Realtime State
    setFirestoreData((prev) => ({
      ...prev,
      trip_requests: {
        ...prev.trip_requests,
        [tripId]: {
          passengerId: 'usr_p1',
          origin: selectedOrigin.name,
          destiny: selectedDestination.name,
          status: 'waiting'
        }
      }
    }));

    // Emit official Analytics Event (Chapter 13)
    emitAnalyticsEvent('trip_requested', {
      tripId,
      origin: selectedOrigin.name,
      destination: selectedDestination.name,
      category: selectedCategory.id,
      distanceKm,
      priceAOA,
      candidatesCount: candidates.length,
      matchingLatencyMs: matchDuration
    });

    // Send invite to top driver (Manuel Sebastião)
    setDriverInviteActive(true);
    setDriverInviteCountdown(15);
  };

  // Request Intent-based Trip (Progressive Mobility Resolver)
  const requestIntentTrip = (
    plan: OperationalTripPlan,
    paymentMethod: ActiveTrip['paymentMethod'],
    paymentTier: 'TIER_1_INVISIBLE' | 'TIER_2_REFERENCE' | 'TIER_3_MANUAL' = 'TIER_1_INVISIBLE'
  ) => {
    const tripId = `trip_${Date.now().toString().slice(-6)}`;
    const startMatchTime = performance.now();

    const candidates: MatchingCandidate[] = drivers
      .filter((d) => d.status === 'online')
      .map((d) => {
        const dDist = calculateHaversineDistanceKm(plan.pickupLocation.lat, plan.pickupLocation.lng, d.lat, d.lng);
        const dEta = Math.max(2, Math.round(dDist * 2.5 + 2));
        const scoreResult = calculateDriverScore({
          distanceKm: dDist,
          driverRating: d.rating,
          etaMinutes: dEta,
          speedKmH: d.speedKmH
        });
        return {
          driver: d,
          distanceKm: dDist,
          etaMins: dEta,
          score: scoreResult.score,
          breakdown: scoreResult.weights
        };
      })
      .sort((a, b) => b.score - a.score);

    const matchDuration = Number((performance.now() - startMatchTime + 18).toFixed(1));
    setLastMatchingLatencyMs(matchDuration);
    setCurrentCandidates(candidates);

    setSelectedOrigin(plan.pickupLocation);
    setSelectedDestination(plan.dropoffLocation);

    // Multicaixa Reference generator for Tier 2 or Reference payment
    const driverPhone = candidates[0]?.driver?.phone || '+244 923 456 789';
    const phoneClean = driverPhone.replace(/\D/g, '').slice(-4);
    const tripNum = tripId.replace(/\D/g, '').slice(-5) || '10293';
    const refNum = `${phoneClean}${tripNum}`.padEnd(9, '7');

    const multicaixaRef = {
      entidade: '00123',
      referencia: `${refNum.slice(0, 3)} ${refNum.slice(3, 6)} ${refNum.slice(6, 9)}`,
      valorAOA: plan.calculatedPriceAOA,
      driverPhone,
      driverName: candidates[0]?.driver?.name || 'Manuel Sebastião'
    };

    const newTrip: ActiveTrip = {
      id: tripId,
      passengerId: 'usr_p1',
      passengerName: 'Domingos Neto',
      passengerPhone: '+244 923 100 200',
      origin: plan.pickupLocation,
      destination: plan.dropoffLocation,
      category: selectedCategory,
      distanceKm: plan.distanceKm,
      durationMins: plan.durationMins,
      priceAOA: plan.calculatedPriceAOA,
      status: 'requesting',
      paymentMethod,
      paymentTier,
      multicaixaRef,
      paymentStatus: 'pending',
      isDestinoVivo: plan.isDestinoVivo,
      entityName: plan.entity?.name,
      matchingDurationMs: matchDuration,
      requestedAt: Date.now(),
      routeCoordinates: [
        [plan.pickupLocation.lat, plan.pickupLocation.lng],
        [
          (plan.pickupLocation.lat + plan.dropoffLocation.lat) / 2 + 0.005,
          (plan.pickupLocation.lng + plan.dropoffLocation.lng) / 2 - 0.004
        ],
        [plan.dropoffLocation.lat, plan.dropoffLocation.lng]
      ]
    };

    setActiveTrip(newTrip);

    setFirestoreData((prev) => ({
      ...prev,
      trip_requests: {
        ...prev.trip_requests,
        [tripId]: {
          passengerId: 'usr_p1',
          origin: plan.pickupLocation.name,
          destiny: plan.dropoffLocation.name,
          status: 'waiting'
        }
      }
    }));

    emitAnalyticsEvent('trip_requested', {
      tripId,
      actionTitle: plan.actionTitle,
      origin: plan.pickupLocation.name,
      destination: plan.dropoffLocation.name,
      isDestinoVivo: plan.isDestinoVivo,
      distanceKm: plan.distanceKm,
      priceAOA: plan.calculatedPriceAOA,
      paymentTier,
      candidatesCount: candidates.length,
      matchingLatencyMs: matchDuration
    });

    setDriverInviteActive(true);
    setDriverInviteCountdown(15);
  };

  // Live Dynamic Destination update during ride (Destino Vivo)
  const updateLiveDestination = (refinedCoord: { lat: number; lng: number }, name?: string) => {
    setActiveTrip((prev) => {
      if (!prev) return null;
      const updatedDestination: LuandaLocation = {
        ...prev.destination,
        name: name || `${prev.destination.name} (Pino Ajustado)`,
        lat: refinedCoord.lat,
        lng: refinedCoord.lng
      };

      const updatedRoute: [number, number][] = [
        prev.routeCoordinates[0] || [prev.origin.lat, prev.origin.lng],
        [
          (prev.origin.lat + refinedCoord.lat) / 2 + 0.003,
          (prev.origin.lng + refinedCoord.lng) / 2 - 0.002
        ],
        [refinedCoord.lat, refinedCoord.lng]
      ];

      return {
        ...prev,
        destination: updatedDestination,
        refinedPinCoord: refinedCoord,
        routeCoordinates: updatedRoute
      };
    });

    emitAnalyticsEvent('trip_requested', {
      action: 'destino_vivo_pin_updated_live',
      newCoord: refinedCoord,
      newName: name
    });
  };

  // Driver Accepts (Fluxo B: Step 3)
  const acceptTripAsDriver = () => {
    if (!activeTrip) return;
    const matchedDriver = currentCandidates[0]?.driver || drivers[0];

    setDriverInviteActive(false);
    setActiveTrip((prev) =>
      prev
        ? {
            ...prev,
            status: 'driver_en_route',
            driverId: matchedDriver.id,
            driver: matchedDriver,
            acceptedAt: Date.now()
          }
        : null
    );

    // Update driver status
    setDrivers((prev) =>
      prev.map((d) => (d.id === matchedDriver.id ? { ...d, status: 'arriving' } : d))
    );

    // Update Firestore active_trips
    setFirestoreData((prev) => ({
      ...prev,
      trip_requests: {
        ...prev.trip_requests,
        [activeTrip.id]: { ...prev.trip_requests[activeTrip.id], status: 'accepted' }
      },
      active_trips: {
        ...prev.active_trips,
        [activeTrip.id]: {
          driverId: matchedDriver.id,
          passengerId: 'usr_p1',
          startTime: new Date().toISOString(),
          routePolyline: 'encoded_poly_kr7b'
        }
      }
    }));

    emitAnalyticsEvent('driver_accepted', {
      tripId: activeTrip.id,
      driverId: matchedDriver.id,
      driverName: matchedDriver.name,
      acceptedWithinSec: 15 - driverInviteCountdown
    });
  };

  // Driver Arrives at pickup point
  const driverArrivedAtPickup = () => {
    if (!activeTrip) return;
    setActiveTrip((prev) => (prev ? { ...prev, status: 'driver_arrived', arrivedAt: Date.now() } : null));

    emitAnalyticsEvent('driver_arrived', {
      tripId: activeTrip.id,
      driverId: activeTrip.driverId,
      pickupLocation: activeTrip.origin.name
    });
  };

  // Start Trip
  const startTripProgression = () => {
    if (!activeTrip) return;
    setActiveTrip((prev) => (prev ? { ...prev, status: 'in_progress', startedAt: Date.now() } : null));
    setDrivers((prev) =>
      prev.map((d) => (d.id === activeTrip.driverId ? { ...d, status: 'in_trip', speedKmH: 42 } : d))
    );

    emitAnalyticsEvent('trip_started', {
      tripId: activeTrip.id,
      driverId: activeTrip.driverId,
      startedAt: new Date().toISOString()
    });
  };

  // Finish Trip & Financial Settlement (Fluxo C)
  const finishTrip = () => {
    if (!activeTrip) return;
    const now = Date.now();
    const tripCost = activeTrip.priceAOA;
    const driverCommissionShare = Math.round(tripCost * 0.85); // 85% to driver, 15% platform

    // Deduct passenger wallet if selected
    if (activeTrip.paymentMethod === 'WALLET') {
      setPassengerWalletAOA((w) => Math.max(0, w - tripCost));
    }

    // Credit driver wallet
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === activeTrip.driverId
          ? {
              ...d,
              status: 'online',
              speedKmH: 0,
              walletBalanceAOA: d.walletBalanceAOA + driverCommissionShare,
              totalTrips: d.totalTrips + 1
            }
          : d
      )
    );

    setActiveTrip((prev) =>
      prev
        ? {
            ...prev,
            status: 'completed',
            paymentStatus: 'paid',
            completedAt: now
          }
        : null
    );

    // PostgreSQL ACID Transaction write (Chapter 12)
    setPostgresData((prev) => ({
      ...prev,
      trips: [
        {
          id: activeTrip.id,
          passenger_id: activeTrip.passengerId,
          driver_id: activeTrip.driverId || 'drv_manuel_01',
          origin: activeTrip.origin.name,
          destiny: activeTrip.destination.name,
          distance_km: activeTrip.distanceKm,
          price_aoa: activeTrip.priceAOA,
          status: 'completed',
          started_at: new Date(activeTrip.startedAt || now - 600000).toISOString(),
          finished_at: new Date(now).toISOString()
        },
        ...prev.trips
      ],
      payments: [
        {
          id: `pay_${now.toString().slice(-6)}`,
          trip_id: activeTrip.id,
          passenger_id: activeTrip.passengerId,
          amount: activeTrip.priceAOA,
          method: activeTrip.paymentMethod,
          status: 'confirmed',
          transaction_id: `EMIS_AO_${Math.floor(10000000 + Math.random() * 90000000)}`,
          paid_at: new Date(now).toISOString()
        },
        ...prev.payments
      ],
      wallet: prev.wallet.map((w) => {
        if (w.user_id === 'usr_p1' && activeTrip.paymentMethod === 'WALLET') {
          return { ...w, balance: w.balance - tripCost, updated_at: new Date().toISOString() };
        }
        if (w.user_id === 'usr_d1') {
          return { ...w, balance: w.balance + driverCommissionShare, updated_at: new Date().toISOString() };
        }
        return w;
      })
    }));

    // Remove from Firestore active_trips
    setFirestoreData((prev) => {
      const nextActive = { ...prev.active_trips };
      delete nextActive[activeTrip.id];
      return {
        ...prev,
        active_trips: nextActive
      };
    });

    // Emitting official events 6, 7, 8 (Chapter 13)
    emitAnalyticsEvent('trip_finished', {
      tripId: activeTrip.id,
      distanceKm: activeTrip.distanceKm,
      priceAOA: tripCost
    });

    emitAnalyticsEvent('payment_completed', {
      tripId: activeTrip.id,
      amountAOA: tripCost,
      method: activeTrip.paymentMethod,
      gateway: 'MULTICAIXA_EXPRESS / EMIS'
    });

    emitAnalyticsEvent('wallet_updated', {
      passengerDeductionAOA: activeTrip.paymentMethod === 'WALLET' ? tripCost : 0,
      driverCreditAOA: driverCommissionShare,
      platformRevenueAOA: tripCost - driverCommissionShare
    });
  };

  // Rate Trip (Event 9: user_rated)
  const rateTrip = (stars: number, comment: string) => {
    if (!activeTrip) return;
    setActiveTrip((prev) => (prev ? { ...prev, rating: stars, ratingComment: comment } : null));

    setPostgresData((prev) => ({
      ...prev,
      ratings: [
        {
          id: `rat_${Date.now().toString().slice(-6)}`,
          trip_id: activeTrip.id,
          author_id: activeTrip.passengerId,
          target_id: activeTrip.driverId || 'drv_manuel_01',
          score: stars,
          comment
        },
        ...prev.ratings
      ]
    }));

    emitAnalyticsEvent('user_rated', {
      tripId: activeTrip.id,
      driverId: activeTrip.driverId,
      score: stars,
      hasComment: Boolean(comment)
    });
  };

  const cancelTrip = () => {
    if (!activeTrip) return;
    setActiveTrip(null);
    setDriverInviteActive(false);
    setDrivers((prev) => prev.map((d) => ({ ...d, status: 'online', speedKmH: 0 })));
  };

  // -------------------------------------------------------------
  // V2.0 UNIFIED SHELL & CAPABILITY RESOLVER HANDLERS
  // -------------------------------------------------------------

  // -------------------------------------------------------------
  // V2.0 SINGLE APP SHELL & AUTH FLOWS
  // -------------------------------------------------------------

  const submitDialpadCode = (code: string): boolean => {
    const clean = code.trim();
    // Master trigger code (*#7668#)
    if (clean === '*#7668#') {
      setTriggerDialpadOpen(false);
      setMasterAuthModalOpen(true);
      emitAnalyticsEvent('app_opened', {
        action: 'master_discovery_trigger_entered',
        codeTrigger: '*#7668#',
        status: 'prompting_firebase_auth_challenge'
      });
      return true;
    }
    // Driver direct entry or driver code (*#1357# or 135790)
    if (clean === '*#1357#' || clean === '135790') {
      setTriggerDialpadOpen(false);
      setDriverAuthModalOpen(true);
      return true;
    }
    return false;
  };

  const authenticateMaster = (method: 'firebase_auth' | 'biometric' = 'firebase_auth'): boolean => {
    // Authenticate through simulated Firebase Auth + Role verification
    setPrimaryState('MASTER');
    setSecondaryState('AUTHENTICATED');
    setUserRole('MASTER');
    setMasterUnlocked(true);
    setMasterAuthModalOpen(false);
    setShellMode('master_ecosystem');
    
    // Switch identity to Admin / Founder & Escalate permissions
    const founderIdentity = PRESET_IDENTITIES[4]; // Kizua / Founder
    setCurrentIdentity(founderIdentity);
    escalatePrivileges(method === 'biometric' ? 'biometric_challenge' : 'debug_sequence');
    
    emitAnalyticsEvent('privilege_escalated', {
      actor: 'Founder / Deus Master',
      authMethod: method,
      roleVerified: 'FOUNDER_OPERATIONS',
      mode: '3_SMARTPHONES_ECOSYSTEM'
    });
    return true;
  };

  const authenticateDriver = (pin: string, useBiometrics: boolean = false): { success: boolean; error?: string } => {
    // Find driver matching PIN or biometric default (Manuel)
    const matchingDriverCred = useBiometrics
      ? managedCredentials.find((c) => c.role === 'DRIVER' && c.id === 'drv_manuel_01')
      : managedCredentials.find((c) => c.role === 'DRIVER' && c.pin === pin.trim());

    if (!matchingDriverCred) {
      return { success: false, error: 'Credencial não reconhecida.' };
    }

    if (matchingDriverCred.status === 'blocked' || matchingDriverCred.status === 'suspended') {
      return {
        success: false,
        error: `Acesso Bloqueado pelo Superadmin (${matchingDriverCred.blockedReason || 'Suspenso'})`
      };
    }

    const driverIdentity = PRESET_IDENTITIES.find((p) => p.type === 'driver') || PRESET_IDENTITIES[2];
    setPrimaryState('DRIVER');
    setSecondaryState('AUTHENTICATED');
    setUserRole('DRIVER');
    setCurrentIdentity(driverIdentity);
    setActivePermissions(driverIdentity.defaultPermissions);
    setShellMode('driver_view');
    setDriverAuthModalOpen(false);

    emitAnalyticsEvent('app_opened', {
      action: 'driver_authenticated',
      method: useBiometrics ? 'biometric_face_id' : `driver_pin_${matchingDriverCred.id}`,
      driverId: matchingDriverCred.id,
      name: matchingDriverCred.name
    });
    return { success: true };
  };

  const lockAndReturnToPublic = () => {
    setSecondaryState('LOCKED');
    setPrimaryState('PUBLIC');
    setUserRole('PASSENGER');
    setMasterUnlocked(false);
    terminateEscalationSession('Bloqueio e retorno ao Portal Público');
    const passengerIdentity = PRESET_IDENTITIES[1]; // Domingos Neto (Passenger)
    setCurrentIdentity(passengerIdentity);
    setActivePermissions(passengerIdentity.defaultPermissions);
    setShellMode('public_passenger');
    
    emitAnalyticsEvent('app_opened', {
      action: 'locked_returned_to_public_mode',
      target: 'public_passenger'
    });
  };

  const startDemoCycle = () => {
    // Reset any ongoing trip and trigger immediate live demo cycle
    resetSimulation();
    const origin = LUANDA_LOCATIONS[0]; // Aeroporto
    const destination = LUANDA_LOCATIONS[1]; // Marginal
    setSelectedOrigin(origin);
    setSelectedDestination(destination);
    
    // Step 1: Passenger requests ride
    requestTrip('MULTICAIXA_EXPRESS');

    // Step 2: Driver accepts automatically after 2 seconds
    setTimeout(() => {
      acceptTripAsDriver();
      
      // Step 3: Driver arrives at pickup after 2.5 seconds
      setTimeout(() => {
        driverArrivedAtPickup();

        // Step 4: Trip starts
        setTimeout(() => {
          startTripProgression();

          // Step 5: Trip finishes after 3 seconds
          setTimeout(() => {
            finishTrip();
          }, 3000);
        }, 1500);
      }, 2500);
    }, 2000);
  };

  const switchIdentity = (profile: UserIdentityProfile) => {
    // If we are currently escalated and switching, gracefully close escalation
    if (escalationSession.isActive) {
      terminateEscalationSession('Troca manual de perfil de usuário');
    }
    setCurrentIdentity(profile);
    setActivePermissions(profile.defaultPermissions);
    emitAnalyticsEvent('app_opened', {
      shellAction: 'identity_switched',
      userId: profile.id,
      identityType: profile.type,
      grantedPermissions: profile.defaultPermissions
    });
  };

  const togglePermission = (permission: AppPermission) => {
    setActivePermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  const hasPermission = (permission: AppPermission): boolean => {
    if (escalationSession.isActive) return true; // Founder has ALL_PERMISSIONS during active escalation
    return activePermissions.includes(permission);
  };

  const escalatePrivileges = (method: PrivilegeEscalationState['method']) => {
    const auditId = `audit_esc_${Date.now()}`;
    const totalTimeout = 60; // 60 seconds of temporary elevated session

    setEscalationSession({
      isActive: true,
      escalatedAt: Date.now(),
      expiresAt: Date.now() + totalTimeout * 1000,
      timeoutSecondsTotal: totalTimeout,
      remainingSeconds: totalTimeout,
      method,
      auditId
    });

    setActivePermissions(ALL_SYSTEM_PERMISSIONS);
    setHiddenEntryModalOpen(false);

    emitAnalyticsEvent('privilege_escalated', {
      auditId,
      method,
      grant: 'ALL_PERMISSIONS',
      timeoutSeconds: totalTimeout,
      escalatedBy: currentIdentity.name,
      origin: 'HiddenEntryEngine -> PrivilegeEscalationEngine'
    });
  };

  const terminateEscalationSession = (reason: string = 'Encerramento manual ou expiração') => {
    if (!escalationSession.isActive) return;

    emitAnalyticsEvent('privilege_revoked', {
      auditId: escalationSession.auditId,
      reason,
      durationActiveSeconds: escalationSession.timeoutSecondsTotal - escalationSession.remainingSeconds
    });

    setEscalationSession({
      isActive: false,
      timeoutSecondsTotal: 60,
      remainingSeconds: 60,
      method: 'biometric_challenge'
    });

    // Restore standard identity permissions
    setActivePermissions(currentIdentity.defaultPermissions);
  };

  // Escalation session countdown & auto-destroy timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (escalationSession.isActive && escalationSession.remainingSeconds > 0) {
      interval = setInterval(() => {
        setEscalationSession((prev) => {
          if (!prev.isActive) return prev;
          if (prev.remainingSeconds <= 1) {
            emitAnalyticsEvent('session_timeout_destroyed', {
              auditId: prev.auditId,
              status: 'auto_destroyed_by_timeout'
            });
            setActivePermissions(currentIdentity.defaultPermissions);
            return {
              isActive: false,
              timeoutSecondsTotal: 60,
              remainingSeconds: 60,
              method: 'biometric_challenge'
            };
          }
          return {
            ...prev,
            remainingSeconds: prev.remainingSeconds - 1
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [escalationSession.isActive, currentIdentity.defaultPermissions]);

  const toggleDriverOnline = (driverId: string) => {
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id === driverId) {
          const nextStatus = d.status === 'online' ? 'offline' : 'online';
          return { ...d, status: nextStatus };
        }
        return d;
      })
    );
  };

  const updateDriverGpsSpeed = (driverId: string, speedKmH: number) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, speedKmH, lastGpsUpdate: Date.now() } : d))
    );
  };

  const resetSimulation = () => {
    setActiveTrip(null);
    setDriverInviteActive(false);
    setDrivers(INITIAL_DRIVERS);
    setSelectedOrigin(LUANDA_LOCATIONS[0]);
    setSelectedDestination(LUANDA_LOCATIONS[1]);
  };

  return (
    <SystemContext.Provider
      value={{
        activeTab,
        setActiveTab,
        shellMode,
        setShellMode,
        primaryState,
        secondaryState,
        userRole,
        demoMode,
        setDemoMode,
        masterFocusPhone,
        setMasterFocusPhone,
        firestoreCore,
        startDemoCycle,
        masterUnlocked,
        triggerDialpadOpen,
        setTriggerDialpadOpen,
        driverAuthModalOpen,
        setDriverAuthModalOpen,
        masterAuthModalOpen,
        setMasterAuthModalOpen,
        submitDialpadCode,
        authenticateMaster,
        authenticateDriver,
        lockAndReturnToPublic,
        currentIdentity,
        activePermissions,
        escalationSession,
        hiddenEntryModalOpen,
        setHiddenEntryModalOpen,
        switchIdentity,
        togglePermission,
        hasPermission,
        escalatePrivileges,
        terminateEscalationSession,
        pricingConfig,
        updatePricingConfig,
        managedCredentials,
        updateUserCredential,
        blockUserCredential,
        unblockUserCredential,
        removeUserCredential,
        passengerGpsLocation,
        setPassengerGpsLocation,
        drivers,
        selectedOrigin,
        setSelectedOrigin,
        selectedDestination,
        setSelectedDestination,
        selectedCategory,
        setSelectedCategory,
        activeTrip,
        passengerWalletAOA,
        currentCandidates,
        lastMatchingLatencyMs,
        analyticsEvents,
        firestoreData,
        postgresData,
        driverInviteActive,
        driverInviteCountdown,
        requestTrip,
        requestIntentTrip,
        updateLiveDestination,
        acceptTripAsDriver,
        driverArrivedAtPickup,
        startTripProgression,
        finishTrip,
        rateTrip,
        cancelTrip,
        toggleDriverOnline,
        updateDriverGpsSpeed,
        resetSimulation,
        emitAnalyticsEvent
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};
