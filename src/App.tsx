/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { SystemProvider, useSystem } from './context/SystemContext';
import { PublicPassengerPortal } from './components/public/PublicPassengerPortal';
import { DriverSinglePhoneView } from './components/driver/DriverSinglePhoneView';
import { SpaNotFoundFallback } from './components/common/SpaNotFoundFallback';

// Lightweight fallback for fast loading on slow connections
const ViewFallbackLoader: React.FC<{ label?: string }> = ({ label = 'Carregando módulo...' }) => (
  <div className="w-full min-h-[300px] flex flex-col items-center justify-center p-8 text-neutral-400 gap-3">
    <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    <span className="text-xs font-mono tracking-wide">{label}</span>
  </div>
);

// Code-splitting heavy Master Ecosystem Views (Loaded on demand to preserve bandwidth & RAM)
const Header = lazy(() => import('./components/Header').then(m => ({ default: m.Header })));
const UnifiedShellExperience = lazy(() => import('./components/shell/UnifiedShellExperience').then(m => ({ default: m.UnifiedShellExperience })));
const DualAppSimulator = lazy(() => import('./components/simulator/DualAppSimulator').then(m => ({ default: m.DualAppSimulator })));
const ConstitutionReader = lazy(() => import('./components/constitution/ConstitutionReader').then(m => ({ default: m.ConstitutionReader })));
const MatchingEngineVisualizer = lazy(() => import('./components/matching/MatchingEngineVisualizer').then(m => ({ default: m.MatchingEngineVisualizer })));
const NetworkTopologyView = lazy(() => import('./components/topology/NetworkTopologyView').then(m => ({ default: m.NetworkTopologyView })));
const SchemaInspector = lazy(() => import('./components/database/SchemaInspector').then(m => ({ default: m.SchemaInspector })));
const FinancialLedgerVisualizer = lazy(() => import('./components/finance/FinancialLedgerVisualizer').then(m => ({ default: m.FinancialLedgerVisualizer })));
const GmailWorkspacePanel = lazy(() => import('./components/gmail/GmailWorkspacePanel').then(m => ({ default: m.GmailWorkspacePanel })));
const GoogleChatWorkspacePanel = lazy(() => import('./components/chat/GoogleChatWorkspacePanel').then(m => ({ default: m.GoogleChatWorkspacePanel })));
const ApiSandbox = lazy(() => import('./components/api/ApiSandbox').then(m => ({ default: m.ApiSandbox })));
const DesignSystemShowcase = lazy(() => import('./components/design/DesignSystemShowcase').then(m => ({ default: m.DesignSystemShowcase })));
const AnalyticsEventStream = lazy(() => import('./components/analytics/AnalyticsEventStream').then(m => ({ default: m.AnalyticsEventStream })));

// Code-splitting security and admin authentication modals
const SecretDialpadModal = lazy(() => import('./components/public/SecretDialpadModal').then(m => ({ default: m.SecretDialpadModal })));
const MasterAuthModal = lazy(() => import('./components/master/MasterAuthModal').then(m => ({ default: m.MasterAuthModal })));
const ShamirBreakglassModal = lazy(() => import('./components/master/ShamirBreakglassModal').then(m => ({ default: m.ShamirBreakglassModal })));
const DriverAuthModal = lazy(() => import('./components/driver/DriverAuthModal').then(m => ({ default: m.DriverAuthModal })));

const AppContent: React.FC = () => {
  const { shellMode, activeTab, isSpaRouteFound, currentPath, navigateSpaRoute } = useSystem();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-[#005A2B] selection:text-white">
      {/* 0. ROTA NÃO ENCONTRADA (SPA Fallback 404 Recovery) */}
      {!isSpaRouteFound ? (
        <main className="flex-1 flex flex-col justify-center items-center">
          <SpaNotFoundFallback
            attemptedPath={currentPath}
            onNavigateHome={() => navigateSpaRoute('/passenger')}
          />
        </main>
      ) : (
        <>
          {/* 1. MODO PÚBLICO: Apenas a tela limpa smartphone style do passageiro */}
          {shellMode === 'public_passenger' && (
            <main className="flex-1 flex flex-col justify-center items-center">
              <PublicPassengerPortal />
            </main>
          )}

          {/* 2. MODO MOTORISTA: Apenas o smartphone do motorista */}
          {shellMode === 'driver_view' && (
            <main className="flex-1 flex flex-col justify-center items-center">
              <DriverSinglePhoneView />
            </main>
          )}

          {/* 3. MODO MASTER/FOUNDER: Bancada administrativa completa */}
          {shellMode === 'master_ecosystem' && (
            <Suspense fallback={<ViewFallbackLoader label="Carregando Console Administrativo RIDING.ao..." />}>
              {/* Header Oficial com Brand, SLA, Abas e Botão de Sair/Bloquear */}
              <Header />

              {/* Container Central da Bancada de Trabalho */}
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
                {activeTab === 'shell' && <UnifiedShellExperience />}
                {activeTab === 'simulator' && <DualAppSimulator />}
                {activeTab === 'constitution' && <ConstitutionReader />}
                {activeTab === 'matching' && <MatchingEngineVisualizer />}
                {activeTab === 'topology' && <NetworkTopologyView />}
                {activeTab === 'database' && <SchemaInspector />}
                {activeTab === 'finance' && <FinancialLedgerVisualizer />}
                {activeTab === 'gmail' && <GmailWorkspacePanel />}
                {activeTab === 'chat' && <GoogleChatWorkspacePanel />}
                {activeTab === 'api' && <ApiSandbox />}
                {activeTab === 'design' && <DesignSystemShowcase />}
                {activeTab === 'analytics' && <AnalyticsEventStream />}
              </main>

              {/* Rodapé Oficial Master */}
              <footer className="border-t border-neutral-800/80 bg-neutral-900/50 py-4 text-center text-xs text-neutral-400">
                <p>RIDING.ao • Sistema de Mobilidade de Angola • Sessão Master Administrativa Ativa</p>
              </footer>
            </Suspense>
          )}
        </>
      )}

      {/* Modais de Segurança e Acesso Camuflado Carregados Sob Demanda */}
      <Suspense fallback={null}>
        <SecretDialpadModal />
        <MasterAuthModal />
        <ShamirBreakglassModal />
        <DriverAuthModal />
      </Suspense>
    </div>
  );
};

export default function App() {
  return (
    <SystemProvider>
      <AppContent />
    </SystemProvider>
  );
}

