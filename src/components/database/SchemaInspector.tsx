import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import {
  Database,
  Zap,
  Table,
  FileJson,
  Code2,
  CheckCircle2,
  Copy,
  Check,
  Search
} from 'lucide-react';

export const SchemaInspector: React.FC = () => {
  const { firestoreData, postgresData } = useSystem();
  const [activeEngine, setActiveEngine] = useState<'firestore' | 'postgres'>('firestore');
  const [selectedCollection, setSelectedCollection] = useState<string>('drivers_online');
  const [selectedTable, setSelectedTable] = useState<string>('trips');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const firestoreCollectionsList = [
    { name: 'drivers_online', desc: 'Status e geohash atual do motorista' },
    { name: 'driver_locations', desc: 'Coordenadas GPS, heading e velocidade' },
    { name: 'trip_requests', desc: 'Solicitações ativas aguardando aceite' },
    { name: 'active_trips', desc: 'Corridas em curso e polylines' },
    { name: 'presence', desc: 'Heartbeat online/lastSeen dos usuários' }
  ];

  const postgresTablesList = [
    { name: 'users', desc: 'Passageiros e credenciais Firebase UID' },
    { name: 'drivers', desc: 'Cadastro de motoristas, CNH e veículos' },
    { name: 'trips', desc: 'Histórico auditado de corridas e tarifas' },
    { name: 'payments', desc: 'Transações financeiras EMIS / Multicaixa' },
    { name: 'wallet', desc: 'Saldos em Kwanzas (AOA) de passageiros e motoristas' },
    { name: 'ratings', desc: 'Avaliações de 1 a 5 estrelas e feedbacks' }
  ];

  const copyToClipboard = (key: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Selector */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#005A2B] text-[#FFC107]">
                <Database className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white">
                Schemas Oficiais de Banco de Dados (Capítulo 12)
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Separação estrita: <strong>5 Coleções no Firestore</strong> (tempo real volátil) e <strong>6 Tabelas no PostgreSQL</strong> (fonte única ACID permanente).
            </p>
          </div>

          {/* Engine Toggle */}
          <div className="flex bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveEngine('firestore')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                activeEngine === 'firestore'
                  ? 'bg-[#005A2B] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4 text-[#FFC107]" />
              <span>Firebase Firestore (5)</span>
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

      {/* Main Studio View */}
      {activeEngine === 'firestore' ? (
        /* FIRESTORE COLLECTIONS STUDIO */
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
                      Realtime
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
      ) : (
        /* POSTGRESQL TABLES STUDIO */
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
                  onClick={() => setSelectedTable(tbl.name)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-[#005A2B] border-emerald-500 text-white shadow-md'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs">public.{tbl.name}</span>
                    <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded font-mono text-blue-300">
                      ACID
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
                Registros: {(postgresData as any)[selectedTable]?.length || 0}
              </span>
            </div>

            {/* Table Rows Viewer */}
            <div className="overflow-x-auto border border-neutral-800 rounded-2xl">
              {((postgresData as any)[selectedTable]?.length || 0) > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 text-neutral-400 font-mono text-[11px] border-b border-neutral-800">
                    <tr>
                      {Object.keys((postgresData as any)[selectedTable][0]).map((col) => (
                        <th key={col} className="p-3">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-neutral-300 font-mono text-[11px]">
                    {(postgresData as any)[selectedTable].map((row: any, i: number) => (
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
          </div>
        </div>
      )}
    </div>
  );
};
