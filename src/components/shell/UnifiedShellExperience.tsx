import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import {
  PRESET_IDENTITIES,
  SYSTEM_MODULES,
  OFFICIAL_PERMISSIONS_CATALOG
} from '../../data/unifiedShellData';
import { AppPermission, UserIdentityProfile } from '../../types/architecture';
import {
  Shield,
  Layers,
  Fingerprint,
  Zap,
  Users,
  Smartphone,
  Wallet,
  Coins,
  Cpu,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Terminal,
  Activity,
  Sparkles,
  Compass,
  FileCheck2,
  Sliders,
  Car,
  Key
} from 'lucide-react';
import { HiddenEntryModal } from './HiddenEntryModal';
import { BootstrapVaultViewer } from './BootstrapVaultViewer';

export const UnifiedShellExperience: React.FC = () => {
  const {
    currentIdentity,
    switchIdentity,
    activePermissions,
    togglePermission,
    hasPermission,
    escalationSession,
    terminateEscalationSession,
    setHiddenEntryModalOpen,
    activeTrip,
    passengerWalletAOA,
    drivers,
    setActiveTab
  } = useSystem();

  const [gestureHoldTimer, setGestureHoldTimer] = useState<number | null>(null);
  const [gestureProgress, setGestureProgress] = useState<number>(0);

  // Press & hold secret gesture handler on the logo
  const handleLogoMouseDown = () => {
    let progress = 0;
    const interval = window.setInterval(() => {
      progress += 20;
      setGestureProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setGestureHoldTimer(null);
        setGestureProgress(0);
        setHiddenEntryModalOpen(true);
      }
    }, 120);
    setGestureHoldTimer(interval);
  };

  const handleLogoMouseUp = () => {
    if (gestureHoldTimer) {
      clearInterval(gestureHoldTimer);
      setGestureHoldTimer(null);
      setGestureProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden Entry Modal */}
      <HiddenEntryModal />

      {/* 1. Header & Architecture V2 Notice */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#005A2B] text-[#FFC107] shadow-inner">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white">
                V2 — Unified Shell & Architecture Baseada em Capacidades
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              O aplicativo nunca pergunta seu papel. A UI nasce diretamente das <strong>permissões atômicas</strong> resolvidas pelo Shell.
            </p>
          </div>

          {/* Secret Gesture Trigger Button */}
          <div className="flex items-center gap-2">
            <button
              onMouseDown={handleLogoMouseDown}
              onMouseUp={handleLogoMouseUp}
              onTouchStart={handleLogoMouseDown}
              onTouchEnd={handleLogoMouseUp}
              className="relative overflow-hidden group flex items-center gap-2 px-4 py-2 rounded-2xl bg-neutral-950 border border-neutral-700 hover:border-emerald-500 text-xs font-bold transition-all shadow-md"
            >
              {/* Hold Progress Bar */}
              {gestureProgress > 0 && (
                <div
                  className="absolute inset-0 bg-[#005A2B]/40 transition-all"
                  style={{ width: `${gestureProgress}%` }}
                />
              )}
              <Fingerprint className="w-4 h-4 text-[#FFC107] relative z-10 group-hover:scale-110 transition-transform" />
              <span className="relative z-10 text-neutral-200">
                {gestureProgress > 0 ? `Segure (${gestureProgress}%)` : 'Gesto Oculto (Segurar)'}
              </span>
            </button>

            <button
              onClick={() => setHiddenEntryModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition-colors"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Desafio Manual</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Escalation Session Alert Banner (if active) */}
      {escalationSession.isActive && (
        <div className="bg-gradient-to-r from-[#005A2B] via-emerald-900 to-neutral-900 border-2 border-emerald-400 rounded-3xl p-5 shadow-2xl text-white flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFC107] text-[#1A1A1A] rounded-2xl font-black shadow-lg animate-pulse">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold bg-black/40 px-2 py-0.5 rounded text-[#FFC107]">
                  Sessão Temporária de Founder Ativa
                </span>
                <span className="text-[10px] font-mono text-emerald-200">{escalationSession.auditId}</span>
              </div>
              <h4 className="text-base font-bold mt-0.5">
                Privilégios Elevados Concedidos (ALL_PERMISSIONS)
              </h4>
              <p className="text-xs text-emerald-100/80">
                Auditado via <code>system.audit</code>. Timeout de autodestruição em andamento.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/60 border border-emerald-500/50 px-4 py-2 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-mono text-emerald-300 block">Tempo Restante:</span>
              <span className="text-lg font-mono font-bold text-[#FFC107]">
                {escalationSession.remainingSeconds}s
              </span>
            </div>

            <button
              onClick={() => terminateEscalationSession('Encerramento manual pelo operador')}
              className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md"
            >
              Destruir Sessão
            </button>
          </div>
        </div>
      )}

      {/* 3. The 6-Stage OS Lifecycle Visualization */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Fluxo de Execução do Unified Shell
          </span>
          <span className="text-[11px] font-mono text-emerald-400">Zero "ifs" de Role no código</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
          {[
            { step: '1', title: 'Unified Shell', desc: 'Single Entry Point' },
            { step: '2', title: 'Splash Engine', desc: 'AOT Init (<1s SLA)' },
            { step: '3', title: 'Session Discovery', desc: 'Token JWT / Device' },
            { step: '4', title: 'Identity Resolver', desc: 'Resolve Capacidades' },
            { step: '5', title: 'Module Registry', desc: 'Filtra Permissões' },
            { step: '6', title: 'Dynamic UI', desc: 'Renderiza Widgets' }
          ].map((item, idx) => (
            <div
              key={item.step}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3 text-center space-y-1 relative"
            >
              <span className="w-5 h-5 mx-auto bg-[#005A2B] text-[#FFC107] rounded-full flex items-center justify-center font-mono text-[10px] font-bold">
                {item.step}
              </span>
              <div className="font-bold text-xs text-white truncate">{item.title}</div>
              <div className="text-[9px] text-neutral-500">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Identity Resolver Simulation & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Identity Selector */}
        <div className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <span className="text-xs font-bold text-neutral-400 uppercase">Simular Identidade</span>
            <Users className="w-4 h-4 text-[#FFC107]" />
          </div>

          <div className="space-y-2">
            {PRESET_IDENTITIES.map((profile) => {
              const isSelected = currentIdentity.id === profile.id;
              return (
                <button
                  key={profile.id}
                  onClick={() => switchIdentity(profile)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-[#005A2B] border-emerald-500 text-white shadow-md ring-2 ring-emerald-400/30'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{profile.name}</span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                        profile.type === 'passenger'
                          ? 'bg-blue-950 text-blue-300'
                          : profile.type === 'driver'
                          ? 'bg-amber-950 text-amber-300'
                          : profile.type === 'admin'
                          ? 'bg-purple-950 text-purple-300'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {profile.type}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-1 line-clamp-1 ${isSelected ? 'text-emerald-100' : 'text-neutral-500'}`}>
                    {profile.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Current Profile Card */}
          <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-2 text-xs">
            <div className="text-neutral-400 text-[10px] uppercase font-mono">Sessão Carregada:</div>
            <div className="font-bold text-white text-sm">{currentIdentity.name}</div>
            <div className="text-neutral-400 text-[11px]">Email: {currentIdentity.emailMasked}</div>
            <div className="text-neutral-400 text-[11px]">Telefone: {currentIdentity.phoneMasked}</div>
          </div>
        </div>

        {/* Right: Atomic Capability Matrix (RBAC) */}
        <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-800">
            <div>
              <span className="text-xs font-bold text-neutral-400 uppercase">
                Matriz de Permissões Atômicas (13)
              </span>
              <p className="text-xs text-neutral-500">
                Clique para alternar permissões e ver os módulos surgirem/sumirem da UI dinamicamente.
              </p>
            </div>

            <div className="text-xs font-mono text-emerald-400 bg-neutral-950 px-3 py-1 rounded-xl border border-neutral-800">
              Ativas: <strong>{activePermissions.length} / 13</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
            {OFFICIAL_PERMISSIONS_CATALOG.map((perm) => {
              const isActive = hasPermission(perm.id);
              return (
                <button
                  key={perm.id}
                  onClick={() => togglePermission(perm.id)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isActive
                      ? 'bg-emerald-950/50 border-emerald-600 text-white shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold truncate">{perm.id}</span>
                    {isActive ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1 font-sans truncate">{perm.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Module Registry & Dynamically Loaded Modules */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#FFC107]" />
              <span>Module Registry & Interface Montada em Tempo Real</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Se o usuário não tem a permissão, o módulo <strong>nem sequer é instanciado</strong>.
            </p>
          </div>

          <div className="text-xs font-mono text-neutral-400">
            Módulos Carregados:{' '}
            <strong className="text-emerald-400">
              {SYSTEM_MODULES.filter((m) => m.requiredPermissions.every((p) => hasPermission(p))).length}{' '}
              / {SYSTEM_MODULES.length}
            </strong>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SYSTEM_MODULES.map((mod) => {
            const isLoaded = mod.requiredPermissions.every((p) => hasPermission(p));
            return (
              <div
                key={mod.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                  isLoaded
                    ? 'bg-neutral-950 border-neutral-700 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-neutral-950/40 border-neutral-800/60 opacity-40 grayscale'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                        isLoaded ? 'bg-[#005A2B] text-white' : 'bg-neutral-800 text-neutral-500'
                      }`}
                    >
                      {mod.badge}
                    </span>
                    {isLoaded ? (
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Montado
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Desmontado
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-xs text-white">{mod.name}</h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">{mod.description}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-neutral-800/80 space-y-1.5">
                  <span className="text-[9px] font-mono text-neutral-500 uppercase block">
                    Permissões Requeridas:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {mod.requiredPermissions.map((req) => (
                      <span
                        key={req}
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          hasPermission(req)
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-900'
                        }`}
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Active Interactive Widgets preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Mobility Simulator Link */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-400" />
              <span>Simulador Dual de Mobilidade</span>
            </h4>
            <span className="text-xs font-mono text-[#FFC107]">Cap. 5 / 7</span>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            Execute o ciclo de ponta a ponta: solicitação de passageiro em Luanda, matching em sub-100ms, recepção pelo motorista (15s), GPS adaptativo e liquidação financeira.
          </p>

          <button
            onClick={() => setActiveTab('simulator')}
            className="w-full py-2.5 rounded-2xl bg-[#005A2B] hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <span>Abrir Simulador Dual Flutter</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Widget 2: Matching Engine SLA */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#FFC107]" />
              <span>Motor de Matching Determinístico</span>
            </h4>
            <span className="text-xs font-mono text-emerald-400">SLA &lt; 100ms</span>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            Algoritmo sem Machine Learning no caminho crítico. 50% Distância, 25% Avaliação, 20% ETA e 5% Velocidade calculados em memória uvloop.
          </p>

          <button
            onClick={() => setActiveTab('matching')}
            className="w-full py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <span>Inspecionar Algoritmo & Pesos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7. Bootstrap Vault & Secret Management Component */}
      <BootstrapVaultViewer />
    </div>
  );
};
