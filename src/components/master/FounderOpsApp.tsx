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
  Trash2
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
    removeUserCredential
  } = useSystem();

  const [activeTab, setActiveTab] = useState<'dispatch' | 'pricing' | 'credentials' | 'finance'>('dispatch');
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [newPinValue, setNewPinValue] = useState<string>('');

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
                    {cred.role !== 'SUPERADMIN' && (
                      <div className="flex items-center gap-1.5 pt-1 border-t border-neutral-800/60">
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
                    <div className="text-[10px] text-neutral-400">Comissão Go.Bro (15%):</div>
                    <div className="font-mono text-base font-black text-[#FFC107]">
                      {formatAOA(platformRevenueEstAOA)}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    15%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ops Footer */}
      <div className="p-2.5 bg-neutral-950 border-t border-neutral-800 shrink-0 text-center text-[10px] text-neutral-500 font-mono">
        Go.Bro Superadmin • Telemetria Operacional
      </div>
    </div>
  );
};
