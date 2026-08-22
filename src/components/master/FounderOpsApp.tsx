import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { formatAOA } from '../../utils/geohashUtils';
import {
  Activity,
  Radio,
  Car,
  TrendingUp,
  Lock,
  Unlock,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Server,
  Sliders,
  UserX,
  Key,
  Shield,
  Trash2,
  RefreshCw,
  FileCheck,
  ShieldAlert,
  Coins,
  Send
} from 'lucide-react';

export const FounderOpsApp: React.FC = () => {
  const {
    drivers,
    activeTrip,
    lastMatchingLatencyMs,
    resetSimulation,
    lockAndReturnToPublic,
    pricingConfig,
    updatePricingConfig,
    managedCredentials,
    blockUserCredential,
    unblockUserCredential,
    updateUserCredential,
    removeUserCredential,
    revokeUserSessions,
    cashReconciliationBatches,
    executeDailyCashReconciliation,
    financialIntents,
    financialTransactions,
    financialEvents,
    financialLedgerEntries,
    financialRetryQueue,
    simulateIncomingWebhook,
    triggerCompensatingRefund,
    runAppyPayReconciliation,
    setShamirBreakglassOpen
  } = useSystem();

  const [activeTab, setActiveTab] = useState<'dispatch' | 'pricing' | 'credentials' | 'finance' | 'reconciliation' | 'ledger'>('dispatch');
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState<string>('');
  const [reconcileSuccess, setReconcileSuccess] = useState<string | null>(null);

  const onlineDriversCount = drivers.filter((d) => d.status !== 'offline').length;
  const totalFleetBalanceAOA = drivers.reduce((acc, d) => acc + d.walletBalanceAOA, 0);
  const platformRevenueEstAOA = Math.round(totalFleetBalanceAOA * (0.15 / 0.85));

  const handleSavePin = (id: string) => {
    if (newPinValue.length >= 4) {
      updateUserCredential(id, { pin: newPinValue });
      setEditingPinId(null);
      setNewPinValue('');
    }
  };

  const handleRunReconciliation = () => {
    const batch = executeDailyCashReconciliation();
    setReconcileSuccess(`Lote ${batch.batchId} reconciliado com sucesso no livro-razão!`);
    setTimeout(() => setReconcileSuccess(null), 4000);
  };

  return (
    <div className="w-full max-w-[360px] mx-auto bg-neutral-950 border-[6px] border-[#FFC107]/80 rounded-[36px] overflow-hidden shadow-2xl flex flex-col h-[680px] relative text-white select-none">
      {/* Mobile Top Notch & Status Bar */}
      <div className="bg-[#1A1A1A] px-5 py-2 flex items-center justify-between text-[11px] font-mono text-neutral-300 border-b border-neutral-800 shrink-0">
        <span className="font-bold">09:41</span>
        <div className="w-20 h-4 bg-neutral-900 rounded-full mx-auto" />
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-[#FFC107] font-bold">OPS SECURE</span>
          <div className="w-2 h-2 rounded-full bg-[#FFC107] animate-pulse" />
        </div>
      </div>

      {/* Founder App Bar */}
      <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 px-4 py-3 text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FFC107] text-neutral-950 flex items-center justify-center font-black text-xs shadow-md">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-white">Central Superadmin</h2>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold">
                ROOT
              </span>
            </div>
            <p className="text-[10px] text-amber-400/90">Gestão Dinâmica & Segurança</p>
          </div>
        </div>

        {/* Lock button */}
        <button
          onClick={lockAndReturnToPublic}
          title="Bloquear Sessão e Voltar ao Público"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800 text-[10px] font-bold transition-all"
        >
          <Lock className="w-3 h-3" />
          <span>Bloquear</span>
        </button>
      </div>

      {/* Ops Navigation Tabs */}
      <div className="bg-neutral-900 px-2 py-1.5 border-b border-neutral-800 flex items-center justify-between text-[10px] font-semibold shrink-0 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`px-2 py-1 rounded-lg transition-colors shrink-0 ${
            activeTab === 'dispatch' ? 'bg-[#005A2B] text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Despacho
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-2 py-1 rounded-lg transition-colors shrink-0 ${
            activeTab === 'pricing' ? 'bg-[#005A2B] text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Tarifas (Kz)
        </button>
        <button
          onClick={() => setActiveTab('credentials')}
          className={`px-2 py-1 rounded-lg transition-colors shrink-0 ${
            activeTab === 'credentials' ? 'bg-[#005A2B] text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Credenciais
        </button>
        <button
          onClick={() => setActiveTab('finance')}
          className={`px-2 py-1 rounded-lg transition-colors shrink-0 ${
            activeTab === 'finance' ? 'bg-[#005A2B] text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Faturamento
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-2 py-1 rounded-lg transition-colors shrink-0 ${
            activeTab === 'reconciliation' ? 'bg-[#005A2B] text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Conciliação (Dinheiro)
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-2 py-1 rounded-lg transition-colors shrink-0 ${
            activeTab === 'ledger' ? 'bg-[#005A2B] text-white' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Livro-Razão & AppyPay
        </button>
      </div>

      {/* Main Ops Content */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-neutral-900 text-neutral-100 text-xs">
        {/* TAB 1: DISPATCH & FLEET */}
        {activeTab === 'dispatch' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-2.5 space-y-1">
                <div className="flex items-center justify-between text-neutral-400 text-[10px]">
                  <span>Frota Ativa</span>
                  <Car className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="font-mono text-base font-black text-white">
                  {onlineDriversCount} <span className="text-xs text-neutral-500 font-normal">/ {drivers.length}</span>
                </div>
                <div className="text-[9px] text-emerald-400 font-semibold">100% GPS Ativo</div>
              </div>

              <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-2.5 space-y-1">
                <div className="flex items-center justify-between text-neutral-400 text-[10px]">
                  <span>Latência Match</span>
                  <Zap className="w-3.5 h-3.5 text-[#FFC107]" />
                </div>
                <div className="font-mono text-base font-black text-[#FFC107]">
                  {lastMatchingLatencyMs} <span className="text-xs font-normal">ms</span>
                </div>
                <div className="text-[9px] text-neutral-400">SLA: &lt; 100ms</div>
              </div>
            </div>

            {/* Active Ride Status */}
            <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-neutral-300">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Despacho da Intenção</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-neutral-400 border border-neutral-700">
                  {activeTrip ? activeTrip.status.toUpperCase() : 'AGUARDANDO'}
                </span>
              </div>

              {activeTrip ? (
                <div className="bg-neutral-950/90 rounded-xl p-2.5 space-y-1 border border-neutral-800 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Recolha:</span>
                    <span className="font-semibold text-white truncate max-w-[170px]">{activeTrip.origin.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Destino:</span>
                    <span className="font-semibold text-white truncate max-w-[170px]">{activeTrip.destination.name}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-neutral-800">
                    <span className="text-neutral-400">Tarifa Dinâmica:</span>
                    <span className="font-mono text-[#FFC107] font-bold">{formatAOA(activeTrip.priceAOA)}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-950/50 rounded-xl p-2.5 text-center text-neutral-400 text-[10px]">
                  Nenhuma corrida ativa. Faça um pedido no <strong>Smartphone 1 (Passageiro)</strong>.
                </div>
              )}
            </div>

            <button
              onClick={resetSimulation}
              className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-neutral-700 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resetar Simulação</span>
            </button>
          </>
        )}

        {/* TAB 2: DYNAMIC PRICING ENGINE (Non-hardcoded, adjustable) */}
        {activeTab === 'pricing' && (
          <div className="space-y-3">
            <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#FFC107]" />
                  <span>Configuração Dinâmica de Tarifas</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">
                  TEMPO REAL
                </span>
              </div>
              <p className="text-[10px] text-neutral-400">
                Os custos são calculados por quilometragem sem hardcode. Nenhuma distância é inferior ao piso mínimo.
              </p>
            </div>

            {/* Min Fare Control */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-neutral-300">Valor Mínimo Garantido (Piso):</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {formatAOA(pricingConfig.minFareAOA)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="300"
                  max="2000"
                  step="50"
                  value={pricingConfig.minFareAOA}
                  onChange={(e) => updatePricingConfig({ minFareAOA: Number(e.target.value) })}
                  className="w-full accent-[#005A2B] h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-neutral-500">
                <span>300 Kz</span>
                <span>Piso Atual: {pricingConfig.minFareAOA} Kz</span>
                <span>2.000 Kz</span>
              </div>
            </div>

            {/* Base Fare & Per Km */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3 space-y-2.5">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-neutral-400">Taxa Base de Partida:</span>
                  <span className="font-mono font-bold text-white">{formatAOA(pricingConfig.baseFareAOA)}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="1500"
                  step="50"
                  value={pricingConfig.baseFareAOA}
                  onChange={(e) => updatePricingConfig({ baseFareAOA: Number(e.target.value) })}
                  className="w-full accent-[#005A2B] h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-neutral-400">Preço por Km:</span>
                  <span className="font-mono font-bold text-white">{formatAOA(pricingConfig.perKmFareAOA)}/km</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="600"
                  step="25"
                  value={pricingConfig.perKmFareAOA}
                  onChange={(e) => updatePricingConfig({ perKmFareAOA: Number(e.target.value) })}
                  className="w-full accent-[#005A2B] h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-neutral-400">Multiplicador Dinâmico:</span>
                  <span className="font-mono font-bold text-[#FFC107]">{pricingConfig.dynamicMultiplier}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.1"
                  value={pricingConfig.dynamicMultiplier}
                  onChange={(e) => updatePricingConfig({ dynamicMultiplier: Number(e.target.value) })}
                  className="w-full accent-[#FFC107] h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CREDENTIALS & INCIDENT MANAGEMENT */}
        {activeTab === 'credentials' && (
          <div className="space-y-2.5">
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Controlo de Acesso & Bloqueio</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono">{managedCredentials.length} contas</span>
              </div>
              <p className="text-[10px] text-neutral-400">
                O Superadmin pode bloquear imediatamente condutores ou administrativos em caso de incidentes operacionais.
              </p>
            </div>

            <div className="space-y-2">
              {managedCredentials.map((cred) => {
                const isBlocked = cred.status === 'blocked' || cred.status === 'suspended';
                return (
                  <div
                    key={cred.id}
                    className={`p-3 rounded-2xl border text-xs space-y-2 transition-all ${
                      isBlocked
                        ? 'bg-red-950/40 border-red-800/80 text-red-200'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{cred.name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                              cred.role === 'SUPERADMIN'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : cred.role === 'ADMIN'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {cred.role}
                          </span>
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">{cred.phone}</div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            isBlocked
                              ? 'bg-red-900/80 text-red-200'
                              : 'bg-emerald-900/80 text-emerald-200'
                          }`}
                        >
                          {isBlocked ? 'BLOQUEADO' : 'ATIVO'}
                        </span>
                      </div>
                    </div>

                    {/* PIN display & quick change */}
                    <div className="flex items-center justify-between bg-neutral-900/80 px-2.5 py-1.5 rounded-xl border border-neutral-800 text-[10px] font-mono">
                      <span className="text-neutral-400">PIN de Acesso:</span>
                      {editingPinId === cred.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            maxLength={6}
                            value={newPinValue}
                            onChange={(e) => setNewPinValue(e.target.value)}
                            placeholder="Novo PIN"
                            className="w-16 bg-black border border-neutral-700 px-1.5 py-0.5 rounded text-white text-[10px] font-mono"
                          />
                          <button
                            onClick={() => handleSavePin(cred.id)}
                            className="px-1.5 py-0.5 bg-[#005A2B] text-white rounded font-bold text-[9px]"
                          >
                            Salvar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#FFC107]">{cred.pin}</span>
                          <button
                            onClick={() => {
                              setEditingPinId(cred.id);
                              setNewPinValue(cred.pin);
                            }}
                            className="text-neutral-400 hover:text-white p-0.5"
                            title="Alterar PIN"
                          >
                            <Key className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isBlocked && cred.blockedReason && (
                      <div className="text-[10px] text-red-300 bg-red-900/30 p-1.5 rounded-lg border border-red-800/40">
                        Motivo: {cred.blockedReason}
                      </div>
                    )}

                    {/* Superadmin actions */}
                    <div className="space-y-1.5 pt-1 border-t border-neutral-800/60">
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                        <span>Época Token: v{cred.sessionEpoch || 1}</span>
                        <button
                          onClick={() => revokeUserSessions(cred.id)}
                          className="px-2 py-0.5 rounded bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800 text-[9px] font-bold flex items-center gap-1 transition-all"
                          title="Revogar todas as sessões e tokens imediatamente (Zero Redis)"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Revogar Sessões</span>
                        </button>
                      </div>

                      {cred.role !== 'SUPERADMIN' && (
                        <div className="flex items-center gap-1.5">
                          {isBlocked ? (
                            <button
                              onClick={() => unblockUserCredential(cred.id)}
                              className="flex-1 py-1 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>Desbloquear Acesso</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => blockUserCredential(cred.id, 'Incidente reportado')}
                              className="flex-1 py-1 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                              <UserX className="w-3 h-3" />
                              <span>Bloquear Incidente</span>
                            </button>
                          )}

                          <button
                            onClick={() => removeUserCredential(cred.id)}
                            className="p-1 rounded-xl bg-neutral-800 hover:bg-red-900 text-neutral-400 hover:text-red-200 border border-neutral-700 text-[10px] transition-colors"
                            title="Remover credencial"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: REVENUE & FINANCE */}
        {activeTab === 'finance' && (
          <div className="space-y-3">
            <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Divisão Financeira 85/15</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono">Luanda Rail</span>
              </div>

              <div className="space-y-2">
                <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-neutral-400">Total Carteiras Motoristas (85%):</div>
                    <div className="font-mono text-base font-black text-emerald-400">
                      {formatAOA(totalFleetBalanceAOA)}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    85%
                  </span>
                </div>

                <div className="bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-neutral-400">Comissão RIDING.ao (15%):</div>
                    <div className="font-mono text-base font-black text-[#FFC107]">
                      {formatAOA(platformRevenueEstAOA)}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    15%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800 flex justify-between items-center text-[10px] text-neutral-400 font-mono">
                <span>Piso Tarifário Mínimo: <strong>{pricingConfig.minFareAOA} Kz</strong></span>
                <span>Split: <strong>Automático Server</strong></span>
              </div>
            </div>

            {/* Break-glass emergency button */}
            <div className="bg-red-950/30 border border-red-900/60 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-red-200">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Protocolo Break-Glass</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 font-mono">
                  SHAMIR 2/3
                </span>
              </div>
              <p className="text-[10px] text-red-300/80">
                Recuperação de contingência para restaurar credenciais mestras em caso de perda do token principal.
              </p>
              <button
                onClick={() => setShamirBreakglassOpen(true)}
                className="w-full py-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Abrir Cofre Shamir (2 de 3)</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: DAILY CASH RECONCILIATION */}
        {activeTab === 'reconciliation' && (
          <div className="space-y-3">
            <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#FFC107]" />
                  <span>Conciliação Diária de Dinheiro / Voucher</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-[#FFC107] font-mono">
                  LOTE DIÁRIO
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                As viagens em dinheiro declaradas pelos motoristas são confrontadas com o livro-razão central. A comissão de 15% é debitada da carteira e o lote é arquivado com hash imutável.
              </p>

              {reconcileSuccess && (
                <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span>{reconcileSuccess}</span>
                </div>
              )}

              <button
                onClick={handleRunReconciliation}
                className="w-full py-2.5 rounded-xl bg-[#005A2B] hover:bg-[#004822] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950 active:scale-[0.98] transition-all"
              >
                <FileCheck className="w-4 h-4 text-[#FFC107]" />
                <span>Executar Fecho e Conciliação em Lote Diário</span>
              </button>
            </div>

            {/* List of Reconciled Batches */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-neutral-300 flex items-center justify-between">
                <span>Histórico de Lotes Reconciliados</span>
                <span className="text-[10px] font-mono text-neutral-500">{cashReconciliationBatches.length} lotes</span>
              </div>

              {cashReconciliationBatches.map((batch) => (
                <div
                  key={batch.batchId}
                  className="bg-neutral-950 border border-neutral-800 rounded-2xl p-2.5 space-y-1.5 text-xs font-mono"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-[11px]">{batch.batchId}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[9px] font-bold">
                      {batch.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-neutral-400">
                    <div>Viagens: <strong className="text-white">{batch.totalTripsCount}</strong></div>
                    <div>Dinheiro: <strong className="text-[#FFC107]">{formatAOA(batch.totalDeclaredCashAOA)}</strong></div>
                    <div>Comissão 15%: <strong className="text-emerald-400">{formatAOA(batch.totalPlatformCommissionAOA)}</strong></div>
                    <div className="truncate">Auditor: <span className="text-neutral-300">{batch.auditorId.slice(0, 14)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: SOVEREIGN FINANCIAL LEDGER & APPYPAY (CHAPTER 17) */}
        {activeTab === 'ledger' && (
          <div className="space-y-3 font-mono">
            <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 font-sans">
                  <Coins className="w-4 h-4 text-[#FFC107]" />
                  <span>Livro-Razão & Gateway AppyPay</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300">
                  ACID
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans leading-relaxed">
                PostgreSQL como única fonte contábil. Split 85% Motorista / 15% Plataforma com rastreabilidade completa.
              </p>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                  <span className="text-neutral-500 text-[9px]">Intenções:</span>
                  <div className="text-white font-bold">{financialIntents.length}</div>
                </div>
                <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                  <span className="text-neutral-500 text-[9px]">Transações:</span>
                  <div className="text-white font-bold">{financialTransactions.length}</div>
                </div>
                <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                  <span className="text-neutral-500 text-[9px]">Eventos Brutos:</span>
                  <div className="text-white font-bold">{financialEvents.length}</div>
                </div>
                <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                  <span className="text-neutral-500 text-[9px]">Lançamentos:</span>
                  <div className="text-emerald-400 font-bold">{financialLedgerEntries.length}</div>
                </div>
              </div>

              {/* Quick Action: Trigger Compensating Refund */}
              <button
                onClick={() => {
                  const targetTx = financialTransactions[0]?.merchantTransactionID;
                  if (targetTx) {
                    const res = triggerCompensatingRefund(targetTx, 'Estorno solicitado via Central Ops');
                    setReconcileSuccess(`Estorno: ${res.message}`);
                    setTimeout(() => setReconcileSuccess(null), 4000);
                  }
                }}
                className="w-full py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors font-sans"
              >
                <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                <span>Simular Estorno Compensatório</span>
              </button>

              {/* Quick Action: Simulate Webhook */}
              <button
                onClick={() => {
                  const targetTx = financialTransactions[0]?.merchantTransactionID || 'MTX_RIDING_TRIP_01';
                  const res = simulateIncomingWebhook({
                    merchantTransactionID: targetTx,
                    eventType: 'PAYMENT_RECEIVED'
                  });
                  setReconcileSuccess(`Webhook Ingerido: [${res.processingStatus}]`);
                  setTimeout(() => setReconcileSuccess(null), 4000);
                }}
                className="w-full py-2 rounded-xl bg-[#005A2B] hover:bg-[#004822] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors font-sans shadow-md"
              >
                <Send className="w-3.5 h-3.5 text-[#FFC107]" />
                <span>Simular Webhook PAYMENT_RECEIVED</span>
              </button>
            </div>

            {/* Latest Ledger Entries */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-neutral-400 font-sans font-bold flex justify-between">
                <span>Últimos Lançamentos Imutáveis</span>
                <span>{financialLedgerEntries.length} registros</span>
              </div>
              {financialLedgerEntries.slice(0, 4).map((entry) => (
                <div key={entry.id} className="bg-neutral-950 p-2 rounded-xl border border-neutral-800 text-[10px] space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-white">{entry.id}</span>
                    <span className="text-[#FFC107]">{formatAOA(entry.grossAmountAOA)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400 text-[9px]">
                    <span>{entry.entryType}</span>
                    <span className="text-emerald-400">Mot: {formatAOA(entry.driverShareAOA)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ops Footer */}
      <div className="p-2.5 bg-neutral-950 border-t border-neutral-800 shrink-0 text-center text-[10px] text-neutral-500 font-mono">
        RIDING.ao Superadmin • Telemetria Operacional
      </div>
    </div>
  );
};
