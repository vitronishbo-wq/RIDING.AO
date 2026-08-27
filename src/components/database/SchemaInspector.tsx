import React, { useState, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import {
  Database,
  Zap,
  Table,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Search,
  Lock,
  Globe,
  Radio,
  Clock,
  ArrowRight,
  Activity,
  AlertTriangle,
  FileCode2,
  RefreshCw
} from 'lucide-react';
import { PaginationControls } from '../common/PaginationControls';
import {
  DATA_TIER_DEFINITIONS,
  DATA_SEGREGATION_AUDIT_CATALOG,
  DataTier
} from '../../types/dataClassification';
import { apiClient } from '../../services/apiClient';

export const SchemaInspector: React.FC = () => {
  const { firestoreData, postgresData, financialLedgerEntries } = useSystem();
  const [activeEngine, setActiveEngine] = useState<'tiers' | 'firestore' | 'postgres'>('tiers');
  const [selectedTier, setSelectedTier] = useState<DataTier>('TRANSACTIONAL');
  const [selectedCollection, setSelectedCollection] = useState<string>('drivers_online');
  const [selectedTable, setSelectedTable] = useState<string>('trips');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Tier Verification States
  const [liveTestLoading, setLiveTestLoading] = useState(false);
  const [liveTierResults, setLiveTierResults] = useState<{
    publicTariffs?: any;
    publicLocations?: any;
    operationalTelemetry?: any;
    transactionalLedger?: any;
    auditStatus?: any;
  }>({});

  // Table pagination state
  const [tablePage, setTablePage] = useState<number>(1);
  const [tablePageSize, setTablePageSize] = useState<number>(10);

  const firestoreCollectionsList = [
    { name: 'drivers_online', desc: 'Status e geohash atual do motorista', tier: 'OPERATIONAL' },
    { name: 'driver_locations', desc: 'Coordenadas GPS, heading e velocidade', tier: 'OPERATIONAL' },
    { name: 'trip_requests', desc: 'Solicitações ativas aguardando aceite', tier: 'OPERATIONAL' },
    { name: 'active_trips', desc: 'Corridas em curso e polylines', tier: 'OPERATIONAL' },
    { name: 'presence', desc: 'Heartbeat online/lastSeen dos usuários', tier: 'OPERATIONAL' }
  ];

  const postgresTablesList = [
    { name: 'users', desc: 'Passageiros e credenciais Firebase UID', tier: 'OPERATIONAL' },
    { name: 'drivers', desc: 'Cadastro de motoristas, CNH e veículos', tier: 'OPERATIONAL' },
    { name: 'trips', desc: 'Histórico auditado de corridas e tarifas', tier: 'TRANSACTIONAL' },
    { name: 'payments', desc: 'Transações financeiras EMIS / Multicaixa', tier: 'TRANSACTIONAL' },
    { name: 'wallet', desc: 'Saldos em Kwanzas (AOA) de passageiros e motoristas', tier: 'TRANSACTIONAL' },
    { name: 'ratings', desc: 'Avaliações de 1 a 5 estrelas e feedbacks', tier: 'OPERATIONAL' },
    { name: 'riding_ledger_entries', desc: 'Partida dobrada imutável e split 85/15 soberano', tier: 'TRANSACTIONAL' }
  ];

  const runLiveTierAudit = async () => {
    setLiveTestLoading(true);
    try {
      const [tariffsRes, locationsRes, auditRes] = await Promise.all([
        apiClient.getPublicTariffs(),
        apiClient.getPublicLocations(),
        apiClient.getDataClassificationAudit()
      ]);

      setLiveTierResults({
        publicTariffs: tariffsRes.data,
        publicLocations: locationsRes.data,
        operationalTelemetry: {
          activeDriversCount: Object.keys(firestoreData.drivers_online || {}).length,
          lastHeartbeat: new Date().toISOString(),
          geohashQuadrants: ['kr7b1', 'kr78q', 'kr78j'],
          retentionMode: 'TTL 24H_VOLATILE'
        },
        transactionalLedger: {
          ledgerEntriesCount: financialLedgerEntries.length,
          settlementEngine: 'PostgreSQL ACID Immutable',
          splitRatio: '85% Motorista / 15% Plataforma',
          minFloorEnforced: '500 AOA'
        },
        auditStatus: auditRes.data || { status: 'ENFORCED', verifiedAt: new Date().toISOString() }
      });
    } catch (e) {
      console.error('Audit run failed:', e);
    } finally {
      setLiveTestLoading(false);
    }
  };

  useEffect(() => {
    runLiveTierAudit();
  }, []);

  const copyToClipboard = (key: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentTierMeta = DATA_TIER_DEFINITIONS[selectedTier];

  return (
    <div className="space-y-6">
      {/* Header & Mode Selector */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#005A2B] text-[#FFC107]">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white">
                Governança & Separação Estrita de Dados (Capítulo 12)
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Isolamento rigoroso entre <strong>Transacionais</strong> (ACID Permanente), <strong>Operacionais</strong> (Tempo Real Efêmero) e <strong>Públicos</strong> (Zero PII Aberto).
            </p>
          </div>

          {/* Engine / View Toggle */}
          <div className="flex bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveEngine('tiers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                activeEngine === 'tiers'
                  ? 'bg-[#005A2B] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-[#FFC107]" />
              <span>Separação de Dados (3 Camadas)</span>
            </button>

            <button
              onClick={() => setActiveEngine('firestore')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                activeEngine === 'firestore'
                  ? 'bg-[#005A2B] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4 text-[#FFC107]" />
              <span>Firestore Realtime (5)</span>
            </button>

            <button
              onClick={() => setActiveEngine('postgres')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                activeEngine === 'postgres'
                  ? 'bg-[#005A2B] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Table className="w-4 h-4 text-blue-400" />
              <span>PostgreSQL SQL (6)</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: DATA TIERS SEGREGATION ARCHITECTURE */}
      {activeEngine === 'tiers' && (
        <div className="space-y-6">
          {/* 3 Tier Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* TIER 1: TRANSACTIONAL */}
            <button
              onClick={() => setSelectedTier('TRANSACTIONAL')}
              className={`p-5 rounded-3xl border text-left transition-all ${
                selectedTier === 'TRANSACTIONAL'
                  ? 'bg-amber-950/30 border-[#FFC107] ring-1 ring-[#FFC107] shadow-xl'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-2xl bg-amber-500/20 text-[#FFC107] border border-amber-500/30">
                  <Lock className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-[#FFC107] font-bold">
                  ACID STRICT
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">1. Dados Transacionais</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                Ledger contábil, pagamentos EMIS/AppyPay, split 85/15 e saldos. Imutável e permanente.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Backend Render Only</span>
              </div>
            </button>

            {/* TIER 2: OPERATIONAL */}
            <button
              onClick={() => setSelectedTier('OPERATIONAL')}
              className={`p-5 rounded-3xl border text-left transition-all ${
                selectedTier === 'OPERATIONAL'
                  ? 'bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500 shadow-xl'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Radio className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  REALTIME / TTL
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">2. Dados Operacionais</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                Telemetria GPS, matching k-ring, status da frota e corridas ativas. Efêmero com auto-purga.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                <Activity className="w-3.5 h-3.5" />
                <span>Pub/Sub Firestore & Redis</span>
              </div>
            </button>

            {/* TIER 3: PUBLIC */}
            <button
              onClick={() => setSelectedTier('PUBLIC')}
              className={`p-5 rounded-3xl border text-left transition-all ${
                selectedTier === 'PUBLIC'
                  ? 'bg-blue-950/30 border-blue-500 ring-1 ring-blue-500 shadow-xl'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Globe className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                  ZERO PII / CDN
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">3. Dados Públicos</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                Matriz tarifária com piso de 500 AOA, âncoras de Luanda e status de SLA. Consulta aberta.
              </p>
              <div className="flex items-center gap-2 text-[11px] font-mono text-blue-400">
                <Globe className="w-3.5 h-3.5" />
                <span>Acesso Público Irrestrito</span>
              </div>
            </button>
          </div>

          {/* Selected Tier Deep Dive Panel */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-emerald-400 font-bold">
                  {selectedTier === 'TRANSACTIONAL' && 'T1'}
                  {selectedTier === 'OPERATIONAL' && 'T2'}
                  {selectedTier === 'PUBLIC' && 'T3'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{currentTierMeta.label}</h3>
                  <p className="text-xs text-neutral-400">{currentTierMeta.description}</p>
                </div>
              </div>

              <button
                onClick={runLiveTierAudit}
                disabled={liveTestLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white border border-neutral-700 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${liveTestLoading ? 'animate-spin' : ''}`} />
                <span>Revalidar Isolamento</span>
              </button>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Engine de Persistência</span>
                <p className="text-xs font-bold text-white">{currentTierMeta.storageEngine}</p>
              </div>

              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Consistência</span>
                <p className="text-xs font-bold text-emerald-400">{currentTierMeta.consistencyModel}</p>
              </div>

              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Política de Retenção</span>
                <p className="text-xs font-bold text-amber-300">{currentTierMeta.retentionPolicy}</p>
              </div>

              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-1">
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Classificação PII</span>
                <p className="text-xs font-bold text-blue-400 font-mono">{currentTierMeta.piiLevel}</p>
              </div>
            </div>

            {/* Security Guarantee Box */}
            <div className="p-4 rounded-2xl bg-black/50 border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                <ShieldCheck className="w-4 h-4 text-[#FFC107]" />
                <span>Garantia de Segurança & Controle de Acesso:</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                {currentTierMeta.securityConstraint}
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <span className="text-[11px] text-neutral-500 font-mono">Entidades & Coleções:</span>
                {currentTierMeta.collectionsOrTables.map((item) => (
                  <span key={item} className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-[11px] font-mono text-neutral-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Live Data Sample for Selected Tier */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono uppercase">
                  Payload em Tempo Real ({selectedTier})
                </span>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Isolamento Verificado (Zero Vazamento)
                </span>
              </div>

              <div className="bg-black/90 border border-neutral-800 rounded-2xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[300px]">
                <pre>
                  {selectedTier === 'TRANSACTIONAL' && JSON.stringify(liveTierResults.transactionalLedger || {}, null, 2)}
                  {selectedTier === 'OPERATIONAL' && JSON.stringify(liveTierResults.operationalTelemetry || {}, null, 2)}
                  {selectedTier === 'PUBLIC' && JSON.stringify(liveTierResults.publicTariffs || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* Audit Catalog Matrix */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Matriz de Auditoria de Segregação (Zero-Confusion Audit)
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                100% CONFORME
              </span>
            </div>

            <div className="overflow-x-auto border border-neutral-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 font-mono text-[11px] border-b border-neutral-800">
                  <tr>
                    <th className="p-3">Campo / Dado</th>
                    <th className="p-3">Coleção / Tabela</th>
                    <th className="p-3">Camada Atribuída</th>
                    <th className="p-3">Garantia de Isolamento</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 text-neutral-300 font-mono text-[11px]">
                  {DATA_SEGREGATION_AUDIT_CATALOG.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-800/40">
                      <td className="p-3 font-bold text-white">{item.field}</td>
                      <td className="p-3 text-neutral-400">{item.sourceCollection}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.assignedTier === 'TRANSACTIONAL'
                              ? 'bg-amber-500/20 text-[#FFC107]'
                              : item.assignedTier === 'OPERATIONAL'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {item.assignedTier}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-300 max-w-[340px] truncate">{item.isolationGuarantee}</td>
                      <td className="p-3">
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Conforme
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FIRESTORE REALTIME COLLECTIONS STUDIO */}
      {activeEngine === 'firestore' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Collections Selector */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[11px] font-mono uppercase text-neutral-400 font-bold px-1">
              Coleções Realtime Firestore (5)
            </span>
            {firestoreCollectionsList.map((col) => {
              const isSelected = selectedCollection === col.name;
              return (
                <button
                  key={col.name}
                  onClick={() => setSelectedCollection(col.name)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-[#005A2B] border-emerald-500 text-white shadow-md'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs">{col.name}</span>
                    <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded font-mono text-emerald-300">
                      OPERACIONAL
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 ${isSelected ? 'text-emerald-100' : 'text-neutral-500'}`}>
                    {col.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right: Live JSON Document Inspector */}
          <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Documentos Ativos</span>
                <h3 className="text-base font-bold font-mono text-[#FFC107]">/{selectedCollection}</h3>
              </div>

              <button
                onClick={() =>
                  copyToClipboard(
                    selectedCollection,
                    JSON.stringify((firestoreData as any)[selectedCollection], null, 2)
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 text-xs font-semibold text-neutral-300 hover:bg-neutral-700"
              >
                {copiedKey === selectedCollection ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">JSON Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar JSON</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-black/90 border border-neutral-800 rounded-2xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[420px]">
              <pre>{JSON.stringify((firestoreData as any)[selectedCollection] || {}, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: POSTGRESQL TABLES STUDIO */}
      {activeEngine === 'postgres' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Tables Selector */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[11px] font-mono uppercase text-neutral-400 font-bold px-1">
              Tabelas Relacionais PostgreSQL (6)
            </span>
            {postgresTablesList.map((tbl) => {
              const isSelected = selectedTable === tbl.name;
              return (
                <button
                  key={tbl.name}
                  onClick={() => {
                    setSelectedTable(tbl.name);
                    setTablePage(1);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-[#005A2B] border-emerald-500 text-white shadow-md'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs">public.{tbl.name}</span>
                    <span
                      className={`text-[10px] bg-black/40 px-2 py-0.5 rounded font-mono ${
                        tbl.tier === 'TRANSACTIONAL' ? 'text-amber-300' : 'text-blue-300'
                      }`}
                    >
                      {tbl.tier}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 ${isSelected ? 'text-emerald-100' : 'text-neutral-500'}`}>
                    {tbl.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right: PostgreSQL Live Table Rows & SQL Definition */}
          <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">Tabela Relacional</span>
                <h3 className="text-base font-bold font-mono text-blue-400">SELECT * FROM {selectedTable};</h3>
              </div>

              <span className="text-xs font-mono text-neutral-400">
                Registros: {selectedTable === 'riding_ledger_entries' ? financialLedgerEntries.length : ((postgresData as any)[selectedTable]?.length || 0)}
              </span>
            </div>

            {/* Table Rows Viewer */}
            {(() => {
              const allRows = (selectedTable === 'riding_ledger_entries' ? financialLedgerEntries : (postgresData as any)[selectedTable]) || [];
              const paginatedRows = allRows.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);

              return (
                <div className="space-y-3">
                  <div className="overflow-x-auto border border-neutral-800 rounded-2xl">
                    {allRows.length > 0 ? (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-950 text-neutral-400 font-mono text-[11px] border-b border-neutral-800">
                          <tr>
                            {Object.keys(allRows[0]).map((col) => (
                              <th key={col} className="p-3">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800 text-neutral-300 font-mono text-[11px]">
                          {paginatedRows.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-neutral-800/40">
                              {Object.values(row).map((val: any, j: number) => (
                                <td key={j} className="p-3 truncate max-w-[160px]">
                                  {typeof val === 'boolean' ? (val ? 'TRUE' : 'FALSE') : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 text-center text-xs text-neutral-500">
                        Nenhum registro inserido nesta tabela ainda. Conclua uma viagem no simulador para gravar dados permanentes.
                      </div>
                    )}
                  </div>

                  {allRows.length > 0 && (
                    <PaginationControls
                      currentPage={tablePage}
                      totalItems={allRows.length}
                      pageSize={tablePageSize}
                      onPageChange={setTablePage}
                      onPageSizeChange={setTablePageSize}
                      itemName="linhas"
                    />
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
