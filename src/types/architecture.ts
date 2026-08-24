export type DeviceSurfacePolicy = 'MOBILE_ONLY' | 'ADAPTIVE';

export interface DeviceSurfaceConfig {
  surface: 'PUBLIC_PORTAL' | 'DRIVER_PORTAL' | 'ADMIN_GOD_FOUNDER';
  policy: DeviceSurfacePolicy;
  supportedEnvironments: string[];
  rules: string[];
}

export const DEVICE_SURFACE_POLICIES: Record<string, DeviceSurfaceConfig> = {
  PUBLIC_PORTAL: {
    surface: 'PUBLIC_PORTAL',
    policy: 'MOBILE_ONLY',
    supportedEnvironments: ['PWA instalado (standalone)', 'Android', 'iOS'],
    rules: [
      'PUBLIC jamais renderiza uma experiência de browser/desktop expandida.',
      'Não é mobile-first responsivo para desktop; é estritamente MOBILE-ONLY.',
      'O Smartphone Frame no console de desenvolvimento é apenas um harness de teste.',
      'Em dispositivo real ou PWA instalado, o viewport é 100% nativo sem frame artificial.'
    ]
  },
  DRIVER_PORTAL: {
    surface: 'DRIVER_PORTAL',
    policy: 'MOBILE_ONLY',
    supportedEnvironments: ['Android', 'iOS'],
    rules: [
      'DRIVER jamais renderiza uma experiência de browser/desktop expandida.',
      'Estritamente MOBILE-ONLY para cockpit veicular.',
      'Em dispositivo real, o viewport é 100% nativo com respeito a safe-area-insets.'
    ]
  },
  ADMIN_GOD_FOUNDER: {
    surface: 'ADMIN_GOD_FOUNDER',
    policy: 'ADAPTIVE',
    supportedEnvironments: ['Desktop-first', 'Tablet', 'Mobile de plantão operacional'],
    rules: [
      'Layout adaptativo de alta densidade.',
      'Painéis expansíveis para telemetria, conciliação e matching em tempo real.'
    ]
  }
};

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

export interface GnssRawTelemetry {
  utcTimestamp: number;
  sequenceId: number;
  lat: number;
  lng: number;
  accuracyRadiusM: number;
  speedMs: number;
  headingDeg: number;
  altitudeM?: number;
  isMockProvider: boolean;
}

export type GpsConfidenceLevel = 'HIGH' | 'ESTIMATED_DEAD_RECKONING' | 'LOW_CONFIDENCE_STALE';

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
  gpsConfidence?: GpsConfidenceLevel;
  deadReckoningSec?: number;
  uncertaintyRadiusM?: number;
  sessionEpoch?: number;
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

export type PaymentSettlementStatus = 'AUTHORIZED' | 'PENDING_RECONCILIATION' | 'SETTLED_CENTRAL' | 'DISPUTED';

export interface DriverTripStopDeclaration {
  tripId: string;
  driverId: string;
  declaredOdometerKm: number;
  declaredFinishedAt: number;
  rawTelemetryPointsCount: number;
  signature: string;
  clientStorageEngine: 'Flutter_SQLCipher' | 'Web_IndexedDB';
}

export interface CentralFareSettlement {
  tripId: string;
  officialDistanceKm: number;
  calculatedPriceAOA: number;
  minimumFloorEnforced: boolean;
  platformFeeAOA: number;
  driverNetShareAOA: number;
  settledAt: number;
  ledgerTransactionId: string;
  validationStatus: 'VALIDATED_BY_SERVER_AUTHORITY' | 'SUSPICIOUS_TELEMETRY_CAPPED';
}

// -------------------------------------------------------------
// RIDING.ao - FINANCIAL & PAYMENT ARCHITECTURE CONTRACTS (AppyPay Integration Matrix)
// -------------------------------------------------------------

/**
 * CLASSIFICAÇÃO DE COMPORTAMENTOS:
 * 1. [AppyPay Confirmado]: Baseado em documentação oficial AppyPay.
 * 2. [Regra Interna RIDING.ao]: Decisões soberanas do core/ledger do RIDING.ao.
 * 3. [Não Confirmado]: Requer confirmação documental da AppyPay antes de codificar.
 */

// [Regra Interna RIDING.ao] - Domínio de métodos suportados pela aplicação
export type RidingPaymentMethod = 'MULTICAIXA_EXPRESS' | 'MULTICAIXA_REFERENCE' | 'CASH' | 'WALLET';
export type RidingPaymentIntentStatus = 'Requested' | 'Pending' | 'Success' | 'Failed' | 'Expired' | 'Refunded';
export type RidingPaymentProvider = 'APPYPAY_GPO' | 'APPYPAY_REF' | 'CASH_DIRECT' | 'INTERNAL_LEDGER';

// [AppyPay Confirmado vs Regra Interna RIDING.ao] - Políticas de Expiração & Timeout
export const APPY_PAY_EXPIRATION = {
  // [AppyPay Confirmado] - Timeout de push notification Multicaixa Express (GPO)
  GPO_PUSH_TIMEOUT_SECONDS: 90,
  // [AppyPay Confirmado] - Validade oficial da Referência Multicaixa gerada no gateway (72h)
  REF_VALIDITY_HOURS: 72,
  REF_VALIDITY_MINUTES: 4320,
} as const;

/**
 * [Regra Comercial Interna RIDING.ao] - NUNCA confundir com regras da AppyPay.
 * O piso de 500 AOA e o split 85/15 são políticas de precificação e comissão soberanas do RIDING.ao,
 * configuráveis dinamicamente pelo domínio financeiro da plataforma.
 */
export interface RidingCommercialFinancialPolicy {
  minRideFloorAOA: number; // Piso mínimo por corrida no RIDING.ao (Padrão: 500 AOA)
  commissionPercentage: number; // Taxa da plataforma RIDING.ao (Padrão: 0.15 / 15%)
  driverSharePercentage: number; // Repasse ao motorista (Padrão: 0.85 / 85%)
  cancellationCompFeeAOA: number; // Taxa de cancelamento compensatória (Padrão: 300 AOA)
  tripDispatchTimeoutMinutes: number; // Timeout para matching de despacho (Padrão: 30 min)
}

export const DEFAULT_RIDING_COMMERCIAL_POLICY: RidingCommercialFinancialPolicy = {
  minRideFloorAOA: 500, // [RIDING_BUSINESS_RULE]
  commissionPercentage: 0.15, // [RIDING_BUSINESS_RULE] 15%
  driverSharePercentage: 0.85, // [RIDING_BUSINESS_RULE] 85%
  cancellationCompFeeAOA: 300, // [RIDING_BUSINESS_RULE] 300 AOA
  tripDispatchTimeoutMinutes: 30 // [RIDING_BUSINESS_RULE] 30 minutos
};

export const RIDING_PAYMENT_POLICY = {
  // [Regra Interna RIDING.ao] - Tolerância máxima de espera pelo matching/motorista antes do cancelamento operacional da corrida
  TRIP_DISPATCH_TIMEOUT_MINUTES: 30,
  // [Regra Interna RIDING.ao] - Divisão padrão do valor da corrida (85/15)
  COMMISSION_PERCENTAGE: 0.15, // 15% RIDING.ao
  DRIVER_SHARE_PERCENTAGE: 0.85, // 85% Motorista
  MIN_RIDE_FLOOR_AOA: 500, // [RIDING_BUSINESS_RULE] Piso mínimo de corrida RIDING.ao
  // [Regra Interna RIDING.ao] - Caso uma REF seja liquidada após cancelamento operacional, o valor é reconciliado internamente (crédito em carteira RIDING)
  HANDLE_POST_CANCEL_REF_SETTLEMENT: 'INTERNAL_WALLET_CREDIT' as const,
  // [AppyPay Confirmado] - REF não suporta refund/reversal automático via API no gateway
  REF_SUPPORTS_API_REFUND: false,
} as const;

// Matriz de Auditoria de Integração Externa (Status antes da codificação)
export interface IntegrationBehaviorItem {
  key: string;
  classification: 'APPYPAY_CONFIRMADO' | 'REGRA_INTERNA_RIDING' | 'NAO_CONFIRMADO_AGUARDANDO_DOCS';
  description: string;
  details: string;
}

export const APPYPAY_INTEGRATION_AUDIT_MATRIX: IntegrationBehaviorItem[] = [
  {
    key: 'APPYPAY_AUTH_CREDENTIALS',
    classification: 'APPYPAY_CONFIRMADO',
    description: 'Autenticação OAuth/Token via client_id e client_secret no backend',
    details: 'Credenciais guardadas exclusivamente no servidor/Secret Manager.'
  },
  {
    key: 'PAYMENT_METHOD_IDS',
    classification: 'NAO_CONFIRMADO_AGUARDANDO_DOCS',
    description: 'IDs numéricos/strings exatos de PaymentMethod na API AppyPay para GPO e REF',
    details: 'Mapeados apenas como enums internos RIDING.ao. Aguardando payload schema oficial.'
  },
  {
    key: 'WEBHOOK_HMAC_SIGNATURE_HEADER',
    classification: 'NAO_CONFIRMADO_AGUARDANDO_DOCS',
    description: 'Nome exato do cabeçalho de assinatura do webhook e algoritmo (e.g. HMAC SHA256)',
    details: 'Não assumir X-AppyPay-Signature até validação formal do cabeçalho emitido pela AppyPay.'
  },
  {
    key: 'WEBHOOK_RETRY_POLICY',
    classification: 'NAO_CONFIRMADO_AGUARDANDO_DOCS',
    description: 'Janelas e backoff de retries do webhook da AppyPay',
    details: 'Não atribuir intervalos fictícios (1m/5m/15m) à AppyPay sem tabela de retries documental.'
  },
  {
    key: 'REF_EXPIRATION_GATEWAY',
    classification: 'APPYPAY_CONFIRMADO',
    description: 'Expiração da Referência Multicaixa no Gateway',
    details: 'Documentado como 72 horas (APPY_PAY_EXPIRATION).'
  },
  {
    key: 'REF_NO_AUTOMATED_REFUND',
    classification: 'APPYPAY_CONFIRMADO',
    description: 'Inexistência de refund/reversal automático via API para REF',
    details: 'Confirmado que o gateway não reverte REF por endpoint. Qualquer estorno é manual/bancário ou saldo em carteira.'
  },
  {
    key: 'RIDING_MIN_RIDE_FLOOR',
    classification: 'REGRA_INTERNA_RIDING',
    description: 'Piso mínimo de corrida de 500 AOA (RIDING_BUSINESS_RULE)',
    details: 'Isolado estritamente como regra de negócio do RIDING.ao. Não é limitação nem regra da AppyPay.'
  },
  {
    key: 'RIDING_85_15_COMMISSION_SPLIT',
    classification: 'REGRA_INTERNA_RIDING',
    description: 'Partição de Receita 85% Motorista / 15% Plataforma',
    details: 'Regra comercial interna configurável do domínio financeiro RIDING.ao, isolada de adaptadores externos.'
  },
  {
    key: 'POST_CANCEL_REF_HANDLING',
    classification: 'REGRA_INTERNA_RIDING',
    description: 'Tratamento de REF paga após cancelamento da corrida',
    details: 'Regra interna RIDING.ao: converte o valor liquidado em saldo na conta do usuário (INTERNAL_WALLET_CREDIT), não sendo um refund da AppyPay.'
  },
  {
    key: 'SOVEREIGN_LEDGER',
    classification: 'REGRA_INTERNA_RIDING',
    description: 'Ledger Contábil Próprio do RIDING.ao',
    details: 'O ledger próprio (PostgreSQL) é a única fonte da verdade contábil. AppyPay é apenas gateway de liquidação.'
  }
];

export interface DriverPaymentAccount {
  id: string;
  driverId: string;
  payoutMethod: 'BANK_IBAN' | 'APPYPAY_DISBURSEMENT' | 'INTERNAL_WALLET';
  iban?: string;
  merchantAccountId?: string;
  status: 'active' | 'pending_kyc' | 'suspended';
  verifiedAt?: number;
}

export interface RidingPaymentIntent {
  id: string;
  rideId: string;
  idempotencyKey: string;
  amountAOA: number;
  currency: 'AOA';
  paymentMethod: RidingPaymentMethod;
  status: RidingPaymentIntentStatus;
  createdAt: number;
  expiresAt: number;
}

export interface RidingPaymentEvent {
  eventId: string;
  merchantTransactionID: string;
  providerTransactionId?: string;
  eventType:
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_EXPIRED'
    | 'PAYMENT_FAILED'
    | 'GPO_REFUND_PROCESSED' // [AppyPay GPO]: Refund executado via API do gateway
    | 'REF_POST_CANCEL_SETTLED' // [AppyPay REF]: Liquidado após cancelamento (sem refund no gateway)
    | 'CASH_CONFIRMED'
    | 'REFUND_COMPLETED';
  receivedAt: number;
  signatureStatus: 'VERIFIED' | 'UNVERIFIED_PENDING_DOCS';
  rawPayload: Record<string, any>;
  processingStatus: 'PROCESSED' | 'IGNORED_DUPLICATE' | 'IGNORED_OUT_OF_ORDER' | 'RETRY_PENDING';
}

export interface RidingPaymentTransaction {
  id: string;
  paymentIntentId: string;
  merchantTransactionID: string; // Idempotent key per payment attempt
  provider: RidingPaymentProvider;
  providerTransactionId?: string;
  status: RidingPaymentIntentStatus;
  amountAOA: number;
  referenceData?: {
    entity: string;
    reference: string;
    expiresAt: number; // 72 horas no gateway (APPY_PAY_EXPIRATION)
  };
  phoneNumber?: string;
  rawWebhookEvents: RidingPaymentEvent[];
  createdAt: number;
  updatedAt: number;
}

export interface RidingLedgerEntry {
  id: string;
  transactionId: string;
  merchantTransactionID: string;
  rideId: string;
  entryType:
    | 'TRIP_FARE_SETTLEMENT'
    | 'CASH_COMMISSION_DEBIT'
    | 'GPO_GATEWAY_REFUND' // [AppyPay GPO]: Estorno originado pelo gateway
    | 'INTERNAL_WALLET_CREDIT_COMPENSATION' // [Regra Interna RIDING.ao]: Compensação em saldo interno (REF não tem refund por API)
    | 'COMPENSATING_REFUND'
    | 'WALLET_CREDIT_POST_CANCEL';
  grossAmountAOA: number;
  platformCommissionAOA: number; // Configurável pelo domínio financeiro (default 15%)
  driverEarningsAOA: number; // Configurável pelo domínio financeiro (default 85%)
  gatewayFeeAOA: number;
  driverId: string;
  passengerId: string;
  settlementType: 'GPO_SETTLED' | 'REF_SETTLED' | 'CASH_RECONCILED' | 'WALLET_TRANSFER';
  status: 'POSTED_TO_LEDGER' | 'RECONCILED_WITH_APPYPAY' | 'DISPUTED' | 'REVERSED';
  postedAt: number;
  reconciledAt?: number;
  reconciliationNotes?: string;
}

export interface AppyPayReconciliationReport {
  reportId: string;
  generatedAt: number;
  totalTransactions: number;
  matchedCount: number;
  disputedCount: number;
  totalGrossAOA: number;
  totalCommissionAOA: number;
  items: Array<{
    merchantTransactionID: string;
    providerTransactionId?: string;
    internalAmountAOA: number;
    externalAmountAOA?: number;
    status: 'MATCHED' | 'DISPUTED_AMOUNT' | 'MISSING_IN_GATEWAY' | 'MISSING_IN_LEDGER';
    resolutionNote?: string;
  }>;
}

export interface InternalRetryJob {
  jobId: string;
  merchantTransactionID: string;
  action: 'POST_TO_LEDGER' | 'RECONCILE_BATCH' | 'NOTIFY_DRIVER_PAYOUT';
  attempts: number;
  maxAttempts: number;
  nextRetryAt: number;
  status: 'PENDING' | 'SUCCESS' | 'EXHAUSTED';
  lastError?: string;
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
  paymentIntentId?: string;
  paymentTransactionId?: string;
  merchantTransactionID?: string;
  settlementStatus?: PaymentSettlementStatus;
  stopDeclaration?: DriverTripStopDeclaration;
  centralSettlement?: CentralFareSettlement;
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
  sessionEpoch?: number;
}

export interface OfflineSyncEvent {
  eventId: string;
  idempotencyKey: string;
  timestamp: number;
  entityType: 'TELEMETRY' | 'STOP_DECLARATION' | 'CASH_PAYMENT_DECLARATION' | 'EMERGENCY_PING';
  payload: Record<string, any>;
  syncStatus: 'QUEUED_LOCAL' | 'ACKNOWLEDGED_BY_SERVER' | 'RECONCILED';
  storageEngine: 'Flutter_SQLCipher' | 'Web_IndexedDB';
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
  method: 'biometric_challenge' | 'debug_sequence' | 'dev_token' | 'nfc_key' | 'shamir_2_of_3_breakglass';
  auditId?: string;
}

export interface ShamirShareKey {
  index: number;
  label: string;
  holder: 'Founder Key (Hardware)' | 'Ops Director (Escrow)' | 'KMS Cold Disaster Recovery';
  hashFragment: string;
}

export interface CashReconciliationBatch {
  batchId: string;
  reconciledAt: number;
  totalTripsCount: number;
  totalDeclaredCashAOA: number;
  totalPlatformCommissionAOA: number;
  auditorId: string;
  status: 'AUDITED_AND_POSTED_TO_LEDGER';
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

