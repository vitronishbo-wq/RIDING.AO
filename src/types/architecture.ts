export interface ConstitutionChapter {
  id: number;
  title: string;
  subtitle: string;
  status: 'FROZEN';
  summary: string;
  rules: string[];
  codeSnippet?: string;
  metadata?: Record<string, any>;
}

export interface ForbiddenTechnology {
  category: string;
  forbidden: string[];
  allowedAlternative: string;
  reason: string;
}

export interface SlaLimit {
  metric: string;
  limit: string;
  currentSimulated: string;
  status: 'optimal' | 'warning' | 'violation';
  detail: string;
}

export interface LuandaLocation {
  id: string;
  name: string;
  neighborhood: string;
  lat: number;
  lng: number;
  geohash: string;
  description: string;
}

export interface DriverState {
  id: string;
  name: string;
  phone: string;
  photoUrl: string;
  vehicleModel: string;
  vehiclePlate: string;
  rating: number;
  totalTrips: number;
  status: 'online' | 'offline' | 'busy' | 'arriving' | 'in_trip';
  lat: number;
  lng: number;
  heading: number;
  speedKmH: number;
  geohash: string;
  walletBalanceAOA: number;
  lastGpsUpdate: number;
}

export interface TripCategory {
  id: 'economico' | 'conforto' | 'express';
  name: string;
  description: string;
  basePriceAOA: number;
  pricePerKmAOA: number;
  multiplier: number;
  etaMins: number;
  icon: string;
}

export interface ActiveTrip {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  driverId?: string;
  driver?: DriverState;
  origin: LuandaLocation;
  destination: LuandaLocation;
  category: TripCategory;
  distanceKm: number;
  durationMins: number;
  priceAOA: number;
  status: 'draft' | 'requesting' | 'matched' | 'driver_en_route' | 'driver_arrived' | 'in_progress' | 'completed' | 'cancelled';
  paymentMethod: 'MULTICAIXA_EXPRESS' | 'WALLET' | 'CASH';
  paymentTier?: 'TIER_1_INVISIBLE' | 'TIER_2_REFERENCE' | 'TIER_3_MANUAL';
  multicaixaRef?: {
    entidade: string;
    referencia: string;
    valorAOA: number;
    driverPhone: string;
    driverName: string;
  };
  paymentStatus: 'pending' | 'paid';
  isDestinoVivo?: boolean;
  entityName?: string;
  refinedPinCoord?: { lat: number; lng: number };
  matchingDurationMs: number;
  requestedAt: number;
  acceptedAt?: number;
  arrivedAt?: number;
  startedAt?: number;
  completedAt?: number;
  rating?: number;
  ratingComment?: string;
  routeCoordinates: [number, number][];
}

// -------------------------------------------------------------
// V2.0 - UNIFIED SHELL, CAPABILITIES & RBAC ENGINE TYPES
// -------------------------------------------------------------

export type AppPermission =
  | 'trip.request'
  | 'trip.accept'
  | 'trip.cancel'
  | 'wallet.read'
  | 'wallet.write'
  | 'finance.read'
  | 'finance.write'
  | 'driver.manage'
  | 'user.manage'
  | 'system.logs'
  | 'system.audit'
  | 'system.config'
  | 'system.override';

export const ALL_SYSTEM_PERMISSIONS: AppPermission[] = [
  'trip.request',
  'trip.accept',
  'trip.cancel',
  'wallet.read',
  'wallet.write',
  'finance.read',
  'finance.write',
  'driver.manage',
  'user.manage',
  'system.logs',
  'system.audit',
  'system.config',
  'system.override'
];

export type IdentityType = 'anonymous' | 'passenger' | 'driver' | 'ops' | 'admin' | 'founder';

export interface UserIdentityProfile {
  id: string;
  type: IdentityType;
  name: string;
  emailMasked: string;
  phoneMasked: string;
  avatar: string;
  defaultPermissions: AppPermission[];
  description: string;
}

export interface SystemModule {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'mobility' | 'finance' | 'admin' | 'security';
  requiredPermissions: AppPermission[];
  badge?: string;
}

export type PrimaryAppState = 'PUBLIC' | 'DRIVER' | 'MASTER';
export type SecondaryAppState = 'AUTHENTICATING' | 'AUTHENTICATED' | 'LOCKED' | 'ERROR';

export type UserRole = 'PASSENGER' | 'DRIVER' | 'MASTER';

export interface FirebaseUserClaim {
  uid: string;
  role: UserRole;
  status: 'active' | 'suspended' | 'pending';
  createdAt: number;
  email?: string;
  phone?: string;
  displayName?: string;
}

export interface FirestoreEssentialCore {
  users: Record<string, { uid: string; role: UserRole; name: string; phone: string; rating: number; walletAOA: number }>;
  drivers: Record<string, { id: string; name: string; status: 'online' | 'busy' | 'offline'; geohash: string; lat: number; lng: number; rating: number; balanceAOA: number; vehiclePlate: string }>;
  rides: Record<string, { id: string; passengerId: string; driverId?: string; origin: string; destination: string; priceAOA: number; status: string; createdAt: number }>;
  vehicles: Record<string, { id: string; driverId: string; makeModel: string; plate: string; year: number; color: string; verified: boolean }>;
  transactions: Record<string, { id: string; rideId: string; fromUid: string; toUid: string; amountAOA: number; commissionAOA: number; method: string; timestamp: number }>;
  locations: Record<string, { id: string; name: string; neighborhood: string; geohash: string; lat: number; lng: number }>;
  settings: Record<string, { commissionRate: number; baseFareAOA: number; perKmFareAOA: number; maxSearchRadiusKm: number; demoModeEnabled: boolean }>;
}

export type ShellViewMode = 'public_passenger' | 'driver_view' | 'master_ecosystem';

export interface PrivilegeEscalationState {
  isActive: boolean;
  escalatedAt?: number;
  expiresAt?: number;
  timeoutSecondsTotal: number;
  remainingSeconds: number;
  method: 'biometric_challenge' | 'debug_sequence' | 'dev_token' | 'nfc_key';
  auditId?: string;
}

export interface BootstrapVaultInfo {
  provider: 'Google Cloud Secret Manager' | 'HashiCorp Vault' | 'Environment KMS';
  environment: 'development' | 'staging' | 'production';
  status: 'sealed' | 'injected_dynamically';
  zeroHardcodedSecretsVerified: boolean;
}

export interface AnalyticsEvent {
  id: string;
  eventName:
    | 'app_opened'
    | 'trip_requested'
    | 'driver_accepted'
    | 'driver_arrived'
    | 'trip_started'
    | 'trip_finished'
    | 'payment_completed'
    | 'wallet_updated'
    | 'user_rated'
    | 'privilege_escalated'
    | 'privilege_revoked'
    | 'session_timeout_destroyed';
  timestamp: string;
  payload: Record<string, any>;
}

export interface FirestoreCollections {
  drivers_online: Record<string, { status: string; geohash: string; lastUpdate: string }>;
  driver_locations: Record<string, { lat: number; lng: number; heading: number; speed: number }>;
  trip_requests: Record<string, { passengerId: string; origin: string; destiny: string; status: string }>;
  active_trips: Record<string, { driverId: string; passengerId: string; startTime: string; routePolyline: string }>;
  presence: Record<string, { online: boolean; lastSeen: string }>;
}

export interface PostgresTables {
  users: Array<{ id: string; name: string; phone: string; email: string; firebase_uid: string; created_at: string }>;
  drivers: Array<{ id: string; user_id: string; vehicle_plate: string; vehicle_model: string; cnh: string; status: string; documents_verified: boolean }>;
  trips: Array<{ id: string; passenger_id: string; driver_id: string; origin: string; destiny: string; distance_km: number; price_aoa: number; status: string; started_at: string; finished_at: string }>;
  payments: Array<{ id: string; trip_id: string; passenger_id: string; amount: number; method: string; status: string; transaction_id: string; paid_at: string }>;
  wallet: Array<{ id: string; user_id: string; balance: number; currency: string; updated_at: string }>;
  ratings: Array<{ id: string; trip_id: string; author_id: string; target_id: string; score: number; comment: string }>;
}

