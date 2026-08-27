/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RIDING.ao - Data Classification & Tier Segregation Architecture
 * 
 * Separação Estrita de Dados em 3 Camadas:
 * 1. TRANSACTIONAL (Dados Transacionais): ACID, Imutável, Ledger Financeiro, Split 85/15, Pagamentos EMIS.
 * 2. OPERATIONAL (Dados Operacionais): Efêmero, Tempo Real, Telemetria GPS, Filas de Despacho, Heartbeats.
 * 3. PUBLIC (Dados Públicos): Consulta aberta, Catálogo de Bairros/Paragens, Matriz Tarifária, Status de SLA.
 */

export type DataTier = 'TRANSACTIONAL' | 'OPERATIONAL' | 'PUBLIC';

export interface DataClassificationRule {
  tier: DataTier;
  label: string;
  description: string;
  storageEngine: string;
  consistencyModel: 'ACID Strict' | 'Eventual / Realtime' | 'Read-Heavy Cacheable Edge';
  retentionPolicy: string;
  accessControl: string;
  piiLevel: 'SENSITIVE_FINANCIAL_PII' | 'EPHEMERAL_OPERATIONAL' | 'ZERO_PII_PUBLIC';
  collectionsOrTables: string[];
  securityConstraint: string;
}

export const DATA_TIER_DEFINITIONS: Record<DataTier, DataClassificationRule> = {
  TRANSACTIONAL: {
    tier: 'TRANSACTIONAL',
    label: 'Camada 1: Dados Transacionais (Ledger & Financeiro)',
    description: 'Registros contábeis de partida dobrada, liquidações bancárias EMIS/AppyPay, split 85/15, faturas e auditoria imutável.',
    storageEngine: 'PostgreSQL Relacional (Fonte Única ACID) + Firestore /transactions (Snapshot imutável)',
    consistencyModel: 'ACID Strict',
    retentionPolicy: 'Permanente (Retenção Fiscal 10 Anos)',
    accessControl: 'Apenas Backend Seguro (Render Service Account) para escrita; Leitura estritamente restrita ao titular autenticado ou Master.',
    piiLevel: 'SENSITIVE_FINANCIAL_PII',
    collectionsOrTables: [
      'transactions',
      'payment_intents',
      'riding_ledger_entries',
      'driver_payment_accounts',
      'reconciliation_reports',
      'receipts'
    ],
    securityConstraint: 'Clientes NUNCA escrevem diretamente. Toda mutação requer transação isolada no Gateway Render.'
  },
  OPERATIONAL: {
    tier: 'OPERATIONAL',
    label: 'Camada 2: Dados Operacionais (Frota & Tempo Real)',
    description: 'Telemetria veicular GPS de alta frequência, coordenadas de corrida em andamento, heartbeats de presença e nós de despacho.',
    storageEngine: 'Firebase Firestore Realtime + Redis InMemory Ingestion',
    consistencyModel: 'Eventual / Realtime',
    retentionPolicy: 'Volátil / TTL 24-48 horas (Purga automática após finalização da corrida)',
    accessControl: 'Motoristas autenticados atualizam suas próprias posições; Passageiros em corrida ativa leem o motorista atribuído.',
    piiLevel: 'EPHEMERAL_OPERATIONAL',
    collectionsOrTables: [
      'driver_locations',
      'drivers_online',
      'driver_telemetry',
      'trip_requests',
      'active_trips',
      'presence',
      'cluster_nodes'
    ],
    securityConstraint: 'Leituras e escritas validadas por token de sessão; sem exposição de dados financeiros ou histórico de terceiros.'
  },
  PUBLIC: {
    tier: 'PUBLIC',
    label: 'Camada 3: Dados Públicos (Referência & Catálogo)',
    description: 'Catálogo de bairros e paragens de Luanda, matriz de tarifas públicas (piso 500 AOA), termos de serviço e status operacional do sistema.',
    storageEngine: 'Edge CDN / Firebase Hosting Cache + Firestore /locations /public_tariffs',
    consistencyModel: 'Read-Heavy Cacheable Edge',
    retentionPolicy: 'Estático / Versionado com releases do sistema',
    accessControl: 'Leitura pública irrestrita (allow read: if true); Escrita exclusiva por Master / Fundador.',
    piiLevel: 'ZERO_PII_PUBLIC',
    collectionsOrTables: [
      'public_tariffs',
      'public_locations',
      'poi_catalog',
      'system_status',
      'api_catalog',
      'public_faqs'
    ],
    securityConstraint: 'Nenhum dado pessoal, bancário ou de corrida é exposto nestas coleções. Totalmente anônimo.'
  }
};

export interface DataSegregationAuditItem {
  id: string;
  field: string;
  sourceCollection: string;
  assignedTier: DataTier;
  isCompliant: boolean;
  isolationGuarantee: string;
}

export const DATA_SEGREGATION_AUDIT_CATALOG: DataSegregationAuditItem[] = [
  {
    id: 'aud-01',
    field: 'merchantTransactionID & amountAOA',
    sourceCollection: 'transactions / riding_ledger_entries',
    assignedTier: 'TRANSACTIONAL',
    isCompliant: true,
    isolationGuarantee: 'Isolado em PostgreSQL ACID com chave de idempotência; sem vazamento em feeds de geolocalização.'
  },
  {
    id: 'aud-02',
    field: 'driverSharePercentage (85%) & platformCommission (15%)',
    sourceCollection: 'riding_ledger_entries / settings',
    assignedTier: 'TRANSACTIONAL',
    isCompliant: true,
    isolationGuarantee: 'Cálculo executado exclusivamente no backend Render com assinatura SHA-256.'
  },
  {
    id: 'aud-03',
    field: 'lat, lng, heading, speedKmH (GPS Stream)',
    sourceCollection: 'driver_locations / driver_telemetry',
    assignedTier: 'OPERATIONAL',
    isCompliant: true,
    isolationGuarantee: 'Separado de identificadores bancários; payload restrito a 256 bytes por ping de telemetria.'
  },
  {
    id: 'aud-04',
    field: 'trip_requests (status: REQUESTING, MATCHING)',
    sourceCollection: 'trip_requests / active_trips',
    assignedTier: 'OPERATIONAL',
    isCompliant: true,
    isolationGuarantee: 'Expira automaticamente após conclusão da corrida; histórico é arquivado na camada transacional.'
  },
  {
    id: 'aud-05',
    field: 'Luanda Neighborhoods & Geohash Anchors',
    sourceCollection: 'public_locations',
    assignedTier: 'PUBLIC',
    isCompliant: true,
    isolationGuarantee: 'Dados geográficos públicos (Marginal, Aeroporto, Kilamba); acessíveis sem autenticação prévia.'
  },
  {
    id: 'aud-06',
    field: 'Base Fare Rates & 500 AOA Minimum Floor',
    sourceCollection: 'public_tariffs',
    assignedTier: 'PUBLIC',
    isCompliant: true,
    isolationGuarantee: 'Tabela de preços transparente distribuída via CDN; sem expor faturamento ou margens individuais.'
  }
];
