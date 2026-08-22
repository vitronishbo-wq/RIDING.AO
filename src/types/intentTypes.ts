import { LuandaLocation } from './architecture';

export type UrbanAnchorType =
  | 'MERCADO'
  | 'HOSPITAL'
  | 'BOMBA'
  | 'ESCOLA'
  | 'PARAGEM_ROTUNDA'
  | 'BANCO'
  | 'SHOPPING'
  | 'CONDOMINIO'
  | 'IGREJA';

export interface UrbanAnchor {
  id: string;
  name: string;
  type: UrbanAnchorType;
  municipio: string;
  bairro: string;
  popularReference: string; // "Depois daquela bomba", "Ao lado do Kero", "Portão 3"
  lat: number;
  lng: number;
  radiusMeters: number; // Approximate region radius
  isRegionOnly?: boolean; // Represents broad area (Destino em aberto)
}

export interface HabitRoutine {
  id: string;
  dayOfWeek: number[]; // 0-6 (0 = Dom, 1 = Seg, etc.)
  timeWindowStart: string; // "07:00"
  timeWindowEnd: string; // "08:30"
  greeting: string; // "Bom dia."
  promptText: string; // "Vai para o trabalho?"
  targetAnchor: UrbanAnchor;
  entityName?: string;
  actionType: MobilityActionType;
}

export type MobilityActionType =
  | 'DESLOCACAO_PROPRIA'
  | 'BUSCAR_TERCEIRO'
  | 'LEVAR_TERCEIRO'
  | 'ENTREGAR_ENCOMENDA'
  | 'DESTINO_EM_ABERTO';

export interface KnownEntity {
  id: string;
  name: string;
  relation: 'filha' | 'filho' | 'mae' | 'pai' | 'esposa' | 'marido' | 'encomenda' | 'outro';
  defaultAnchor?: UrbanAnchor;
  registeredAnchors?: UrbanAnchor[];
  defaultPickupLocation?: LuandaLocation;
  defaultDropoffLocation?: LuandaLocation;
  registeredLocations?: LuandaLocation[];
  phone?: string;
  notes?: string;
}

export interface FrequentContextLocation {
  id: string;
  type: string;
  label: string;
  location: LuandaLocation;
  associatedEntityId?: string;
}

export type PaymentTierType =
  | 'TIER_1_INVISIBLE' // Multicaixa Express Direct, Apple Pay, Wallet
  | 'TIER_2_REFERENCE' // Multicaixa Reference (Entidade, Referência, Valor)
  | 'TIER_3_MANUAL'; // Dinheiro, QR ou Transferência Direta

export interface MulticaixaReferenceData {
  entidade: string; // e.g. "00123"
  referencia: string; // e.g. "923 456 789" (Motorista ID / Tel associado)
  valorAOA: number;
  expiraEmMinutos: number; // 4320 min (72h no gateway AppyPay)
  expiraEmHorasGateway?: number; // 72h oficial AppyPay
  driverPhone: string;
  driverName: string;
}

export interface OperationalTripPlan {
  actionType: MobilityActionType;
  actionTitle: string; // e.g. "Buscar Maria" or "Mercado do Quilamba"
  entity?: KnownEntity | null;
  passengerGpsLocation: LuandaLocation;
  pickupLocation: LuandaLocation;
  dropoffLocation: LuandaLocation;
  isDestinoVivo: boolean; // True if destination is broad region/open
  refinedPinCoord?: { lat: number; lng: number };
  distanceKm: number;
  durationMins: number;
  calculatedPriceAOA: number;
  formulaBreakdown: string;
}

export interface DynamicPricingConfig {
  minFareAOA: number; // e.g. 500 Kz (non-hardcoded minimum)
  baseFareAOA: number; // e.g. 400 Kz
  perKmFareAOA: number; // e.g. 220 Kz
  perMinuteFareAOA: number; // e.g. 20 Kz
  dynamicMultiplier: number;
  nightMultiplier?: number;
  peakMultiplier?: number;
}

export interface ManagedUserCredential {
  id: string;
  name: string;
  role: 'DRIVER' | 'OPS_ADMIN' | 'SUPPORT';
  pin: string;
  phone: string;
  status: 'active' | 'blocked' | 'suspended';
  vehiclePlate?: string;
  blockedReason?: string;
  updatedAt: string;
}
