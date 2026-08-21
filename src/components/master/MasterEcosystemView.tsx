import React, { useState } from 'react';
import { PassengerApp } from '../simulator/PassengerApp';
import { DriverApp } from '../simulator/DriverApp';
import { FounderOpsApp } from './FounderOpsApp';
import { LuandaMapCanvas } from '../simulator/LuandaMapCanvas';
import { SchemaInspector } from '../database/SchemaInspector';
import { useSystem } from '../../context/SystemContext';
import {
  Smartphone,
  ShieldCheck,
  Lock,
  RotateCcw,
  Play,
  Layers,
  Database,
  MapPin,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  Server
} from 'lucide-react';

export const MasterEcosystemView: React.FC = () => {
  const {
    lockAndReturnToPublic,
    resetSimulation,
    lastMatchingLatencyMs,
    masterFocusPhone,
    setMasterFocusPhone,
    demoMode,
    setDemoMode,
    startDemoCycle,
    firestoreCore
  } = useSystem();

  const [expandedInspectView, setExpandedInspectView] = useState<'none' | 'map' | 'database' | 'firestore_core'>('none');
  const [selectedCoreCollection, setSelectedCoreCollection] = useState<'users' | 'drivers' | 'rides' | 'vehicles' | 'transactions' | 'locations' | 'settings'>('users');

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 4.4 Top Master Control Ribbon */}
      <div className="bg-neutral-900 border-2 border-[#FFC107]/70 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
        {/* Row 1: Brand & Direct Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#005A2B] border border-[#FFC107] flex items-center justify-center text-[#FFC107] shadow-lg shadow-emerald-950">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#FFC107] uppercase tracking-wider font-mono">MASTER CONTROL</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                  DEUS FUNDADOR
                </span>
                {demoMode && (
                  <span className="px-2 py-0.5 rounded-full bg-[#FFC107]/20 text-[#FFC107] font-mono text-[10px] font-bold border border-[#FFC107]/40">
                    MODO DEMO ATIVO
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Os 3 Smartphones do Ecossistema Go.Bro.Aao • Luanda
              </h2>
            </div>
          </div>

          {/* Action buttons: Demo & Lock */}
          <div className="flex items-center gap-2">
            <button
              onClick={startDemoCycle}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-all"
              title="Executar fluxo completo demonstrativo (Passageiro -> Motorista -> Despacho)"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Executar Demo</span>
            </button>

            <button
              onClick={resetSimulation}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 transition-all"
              title="Resetar estado local dos smartphones"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resetar</span>
            </button>

            {/* 4.11 LOCK BUTTON */}
            <button
              onClick={lockAndReturnToPublic}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-950 transition-all"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Bloquear</span>
            </button>
          </div>
        </div>

        {/* Row 2: 4.4 Top Controls [ Passageiro ] [ Motorista ] [ Operações ] [ Bloquear ] */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-2xl border border-neutral-800">
            <button
              onClick={() => setMasterFocusPhone('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                masterFocusPhone === 'all'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Todos (3 Telas)
            </button>
            <button
              onClick={() => setMasterFocusPhone('passenger')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                masterFocusPhone === 'passenger'
                  ? 'bg-[#005A2B] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Passageiro
            </button>
            <button
              onClick={() => setMasterFocusPhone('driver')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                masterFocusPhone === 'driver'
                  ? 'bg-[#FFC107] text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Motorista
            </button>
            <button
              onClick={() => setMasterFocusPhone('ops')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                masterFocusPhone === 'ops'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Operações
            </button>
          </div>

          {/* Quick Technical Drawers */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setExpandedInspectView(expandedInspectView === 'firestore_core' ? 'none' : 'firestore_core')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                expandedInspectView === 'firestore_core'
                  ? 'bg-[#005A2B] text-white border-emerald-500'
                  : 'bg-neutral-800/90 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-[#FFC107]" />
              <span>7 Coleções Firestore</span>
            </button>

            <button
              onClick={() => setExpandedInspectView(expandedInspectView === 'map' ? 'none' : 'map')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                expandedInspectView === 'map'
                  ? 'bg-[#005A2B] text-white border-emerald-500'
                  : 'bg-neutral-800/90 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Grid Luanda</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4.6 & 4.7 Essential 7 Firestore Collections Inspector */}
      {expandedInspectView === 'firestore_core' && (
        <div className="bg-neutral-900 border-2 border-emerald-500/40 rounded-3xl p-5 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">
                  4.6 — Firestore como Núcleo de Dados (7 Coleções Essenciais)
                </h3>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Regra 4.7: Segurança estrita no Firestore. O frontend nunca decide sozinho permissões de leitura/escrita.
              </p>
            </div>

            <button
              onClick={() => setExpandedInspectView('none')}
              className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg bg-neutral-800"
            >
              Fechar
            </button>
          </div>

          {/* Collection Tabs */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(['users', 'drivers', 'rides', 'vehicles', 'transactions', 'locations', 'settings'] as const).map((col) => (
              <button
                key={col}
                onClick={() => setSelectedCoreCollection(col)}
                className={`px-3 py-1.5 rounded-xl font-mono uppercase font-bold border transition-colors ${
                  selectedCoreCollection === col
                    ? 'bg-[#005A2B] text-white border-emerald-400 shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                /{col}
              </button>
            ))}
          </div>

          {/* Table / JSON Viewer */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 overflow-x-auto">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400 pb-2 mb-2 border-b border-neutral-800">
              <span>Coleção: <strong className="text-emerald-400">/{selectedCoreCollection}</strong></span>
              <span className="text-[11px] text-neutral-500">Security: Enforced by Firestore Rules (RBAC)</span>
            </div>
            <pre className="text-xs font-mono text-emerald-300/90 leading-relaxed max-h-60 overflow-y-auto">
              {JSON.stringify(firestoreCore[selectedCoreCollection], null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Map Inspector Drawer */}
      {expandedInspectView === 'map' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FFC107]" />
              <span>Mapa de Despacho & Grid Geohash de Luanda</span>
            </h3>
            <button
              onClick={() => setExpandedInspectView('none')}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Fechar
            </button>
          </div>
          <LuandaMapCanvas />
        </div>
      )}

      {/* 4.4 & 4.13 THE 3 SMARTPHONES (Responsive: side-by-side on desktop, stack/filter on mobile) */}
      <div className={`grid gap-6 items-start ${
        masterFocusPhone === 'all'
          ? 'grid-cols-1 lg:grid-cols-3'
          : 'grid-cols-1 max-w-md mx-auto'
      }`}>
        {/* Smartphone 1: PASSAGEIRO */}
        {(masterFocusPhone === 'all' || masterFocusPhone === 'passenger') && (
          <div className="flex flex-col items-center">
            <div className="mb-2.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 flex items-center gap-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#005A2B]" />
              <span>SMARTPHONE 01 — PASSAGEIRO</span>
            </div>
            <PassengerApp />
          </div>
        )}

        {/* Smartphone 2: MOTORISTA */}
        {(masterFocusPhone === 'all' || masterFocusPhone === 'driver') && (
          <div className="flex flex-col items-center">
            <div className="mb-2.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 flex items-center gap-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFC107]" />
              <span>SMARTPHONE 02 — MOTORISTA</span>
            </div>
            <DriverApp />
          </div>
        )}

        {/* Smartphone 3: FUNDADOR / OPERAÇÕES */}
        {(masterFocusPhone === 'all' || masterFocusPhone === 'ops') && (
          <div className="flex flex-col items-center">
            <div className="mb-2.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 flex items-center gap-2 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span>SMARTPHONE 03 — FUNDADOR</span>
            </div>
            <FounderOpsApp />
          </div>
        )}
      </div>
    </div>
  );
};
