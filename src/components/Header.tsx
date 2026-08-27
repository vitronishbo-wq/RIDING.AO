import React from 'react';
import { useSystem } from '../context/SystemContext';
import { buildCanonicalPath } from '../utils/spaRouter';
import {
  ShieldCheck,
  Smartphone,
  BookOpen,
  Cpu,
  Network,
  Database,
  Terminal,
  Palette,
  Activity,
  Zap,
  MapPin,
  Layers,
  LogOut,
  UserCheck,
  Coins,
  Mail,
  MessageSquare
} from 'lucide-react';

interface NavItem {
  id: 'shell' | 'simulator' | 'constitution' | 'matching' | 'topology' | 'database' | 'api' | 'design' | 'analytics' | 'finance' | 'gmail' | 'chat';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    lastMatchingLatencyMs,
    activeTrip,
    escalationSession,
    currentIdentity,
    lockAndReturnToPublic,
    terminateEscalationSession
  } = useSystem();

  const isAdministrativeSession = escalationSession.isActive || currentIdentity.type === 'founder' || currentIdentity.type === 'admin';

  const handleExitAdmin = () => {
    terminateEscalationSession('Encerramento via Header');
    lockAndReturnToPublic();
    setActiveTab('simulator');
  };

  const navItems: NavItem[] = [
    {
      id: 'shell',
      label: 'V2 Unified Shell & RBAC',
      icon: Layers,
      badge: escalationSession.isActive ? `Founder (${escalationSession.remainingSeconds}s)` : 'V2.0'
    },
    { id: 'simulator', label: 'Simulador Dual (Flutter)', icon: Smartphone, badge: activeTrip ? 'Viagem Ativa' : undefined },
    { id: 'constitution', label: 'Constituição (15 Caps)', icon: BookOpen, badge: 'FROZEN' },
    { id: 'matching', label: 'Motor de Matching', icon: Cpu, badge: `${lastMatchingLatencyMs}ms` },
    { id: 'topology', label: 'Topologia & Rede', icon: Network },
    { id: 'database', label: 'Bancos (Firestore / SQL)', icon: Database },
    { id: 'finance', label: 'Cadeia Financeira (Cap 17)', icon: Coins, badge: 'AppyPay' },
    { id: 'gmail', label: 'Gmail & Recibos', icon: Mail, badge: 'Workspace' },
    { id: 'chat', label: 'Google Chat & Frota', icon: MessageSquare, badge: 'Workspace' },
    { id: 'api', label: 'APIs & Payloads', icon: Terminal },
    { id: 'design', label: 'Design System', icon: Palette },
    { id: 'analytics', label: 'Eventos & Auditoria', icon: Activity }
  ];

  return (
    <header className="bg-[#1A1A1A] border-b border-neutral-800 text-white sticky top-0 z-50">
      {/* Top Banner: Brand and Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          {/* Official Brand Logo */}
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#005A2B] via-emerald-600 to-[#00381B] border-2 border-[#FFC107] flex items-center justify-center font-bold text-white shadow-lg overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent" />
            <span className="relative text-base tracking-tighter font-mono font-black italic text-[#FFC107] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              R
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black italic tracking-[0.2em] bg-gradient-to-r from-white via-neutral-100 to-[#FFC107] bg-clip-text text-transparent flex items-center gap-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                RIDING
                <span className="w-2 h-2 rounded-full bg-[#FFC107] shadow-[0_0_8px_#FFC107] inline-block animate-pulse not-italic" />
                <span className="text-xs not-italic text-[#FFC107] font-mono font-bold bg-[#FFC107]/10 px-2 py-0.5 rounded border border-[#FFC107]/30 tracking-normal ml-1">
                  Angola Mobility
                </span>
              </h1>
            </div>
            <p className="text-xs text-neutral-400">
              Sistema Operacional & Console Arquitetural Oficial • Luanda, AO
            </p>
          </div>
        </div>

        {/* Status Indicators (Frozen, SLAs and Admin Exit) */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Active Identity Badge & Exit Button if Admin/Founder */}
          {isAdministrativeSession ? (
            <div className="flex items-center gap-2 bg-gradient-to-r from-red-950/70 to-neutral-900 border border-red-500/50 px-3 py-1 rounded-lg text-white animate-in fade-in">
              <div className="flex items-center gap-1.5 text-red-300">
                <UserCheck className="w-3.5 h-3.5 text-[#FFC107]" />
                <span className="font-mono text-[11px] font-bold">{currentIdentity.name} ({currentIdentity.badgeLabel})</span>
              </div>
              <button
                onClick={handleExitAdmin}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-[10px] px-2 py-0.5 rounded transition-all ml-1 shadow-sm"
                title="Encerrar sessão administrativa e voltar ao smartphone público"
              >
                <LogOut className="w-3 h-3" />
                <span>Sair p/ Público</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#005A2B]/30 text-emerald-300 border border-[#005A2B] px-3 py-1 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-[#FFC107]" />
              <span className="font-mono font-semibold">ESPECIFICAÇÃO: FROZEN (v1.0)</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 px-3 py-1 rounded-lg text-neutral-300">
            <Zap className="w-3.5 h-3.5 text-[#FFC107]" />
            <span>Matching SLA: <strong className="text-emerald-400 font-mono">&lt; 100ms</strong> ({lastMatchingLatencyMs}ms)</span>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 px-3 py-1 rounded-lg text-neutral-300">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Região: <strong className="text-white">Luanda (AOA)</strong></span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar py-2 border-t border-neutral-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const href = buildCanonicalPath('master_ecosystem', item.id);
            return (
              <a
                key={item.id}
                id={`tab-btn-${item.id}`}
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#005A2B] text-white shadow-sm border border-emerald-500/30'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#FFC107]' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isActive
                        ? 'bg-[#FFC107] text-[#1A1A1A]'
                        : item.badge === 'Viagem Ativa'
                        ? 'bg-emerald-500 text-white animate-pulse'
                        : 'bg-neutral-700 text-neutral-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
