/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SystemProvider, useSystem } from './context/SystemContext';
import { PublicPassengerPortal } from './components/public/PublicPassengerPortal';
import { DriverSinglePhoneView } from './components/driver/DriverSinglePhoneView';
import { Header } from './components/Header';
import { DualAppSimulator } from './components/simulator/DualAppSimulator';
import { UnifiedShellExperience } from './components/shell/UnifiedShellExperience';
import { ConstitutionReader } from './components/constitution/ConstitutionReader';
import { MatchingEngineVisualizer } from './components/matching/MatchingEngineVisualizer';
import { NetworkTopologyView } from './components/topology/NetworkTopologyView';
import { SchemaInspector } from './components/database/SchemaInspector';
import { FinancialLedgerVisualizer } from './components/finance/FinancialLedgerVisualizer';
import { ApiSandbox } from './components/api/ApiSandbox';
import { DesignSystemShowcase } from './components/design/DesignSystemShowcase';
import { AnalyticsEventStream } from './components/analytics/AnalyticsEventStream';
import { SecretDialpadModal } from './components/public/SecretDialpadModal';
import { MasterAuthModal } from './components/master/MasterAuthModal';
import { ShamirBreakglassModal } from './components/master/ShamirBreakglassModal';
import { DriverAuthModal } from './components/driver/DriverAuthModal';

const AppContent: React.FC = () => {
  const { shellMode, activeTab } = useSystem();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-[#005A2B] selection:text-white">
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
        <>
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
            {activeTab === 'api' && <ApiSandbox />}
            {activeTab === 'design' && <DesignSystemShowcase />}
            {activeTab === 'analytics' && <AnalyticsEventStream />}
          </main>

          {/* Rodapé Oficial Master */}
          <footer className="border-t border-neutral-800/80 bg-neutral-900/50 py-4 text-center text-xs text-neutral-400">
            <p>RIDING.ao • Sistema de Mobilidade de Angola • Sessão Master Administrativa Ativa</p>
          </footer>
        </>
      )}

      {/* Modais de Segurança e Acesso Camuflado */}
      <SecretDialpadModal />
      <MasterAuthModal />
      <ShamirBreakglassModal />
      <DriverAuthModal />
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

