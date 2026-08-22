import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { DeviceViewportWrapper } from '../shell/DeviceViewportWrapper';
import { formatAOA } from '../../utils/pricing';
import { getAdaptiveGpsInterval } from '../../utils/adaptiveGps';
import {
  Power,
  Navigation,
  CheckCircle2,
  Car,
  Wallet,
  Star,
  MapPin,
  Clock,
  Gauge,
  Phone,
  Flame,
  AlertCircle,
  Radio,
  WifiOff,
  Wifi,
  ShieldCheck,
  Database,
  Lock
} from 'lucide-react';

export const DriverApp: React.FC = () => {
  const {
    drivers,
    activeTrip,
    driverInviteActive,
    driverInviteCountdown,
    acceptTripAsDriver,
    driverArrivedAtPickup,
    startTripProgression,
    submitDriverTripStopDeclaration,
    toggleDriverOnline,
    updateDriverGpsSpeed,
    isGpsSignalLost,
    simulateGpsSignalLoss,
    driverDeadReckoningSec,
    driverGpsConfidence,
    offlineSyncQueue
  } = useSystem();

  // We bind the Driver App simulator to Driver 1: Manuel Sebastião
  const currentDriver = drivers[0];
  const isOnline = currentDriver.status !== 'offline';
  const gpsRule = getAdaptiveGpsInterval(currentDriver.speedKmH);

  return (
    <DeviceViewportWrapper
      policy="MOBILE_ONLY"
      appName="Driver"
      borderAccentColor="border-neutral-800"
    >
      {/* Mobile Top Notch & Status Bar */}
      <div className="bg-[#1A1A1A] px-5 py-2 flex items-center justify-between text-[11px] font-mono text-neutral-300 border-b border-neutral-800 shrink-0">
        <span className="font-bold">09:41</span>
        <div className="w-20 h-4 bg-neutral-900 rounded-full mx-auto" />
        <div className="flex items-center gap-1.5 text-[10px]">
          {isGpsSignalLost ? (
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <WifiOff className="w-3 h-3 text-amber-400 animate-pulse" />
              DR ({driverDeadReckoningSec}s)
            </span>
          ) : (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-400" />
              GPS Fix
            </span>
          )}
        </div>
      </div>

      {/* Flutter Driver App Bar */}
      <div className="bg-[#1A1A1A] px-4 py-3 text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <img
            src={currentDriver.photoUrl}
            alt={currentDriver.name}
            className="w-9 h-9 rounded-xl object-cover border-2 border-[#FFC107]"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-white">{currentDriver.name.split(' ')[0]}</h2>
              <div className="flex items-center gap-0.5 text-[10px] text-[#FFC107]">
                <Star className="w-3 h-3 fill-[#FFC107]" />
                <span className="font-bold">{currentDriver.rating}</span>
              </div>
            </div>
            <p className="text-[10px] text-neutral-400 font-mono">{currentDriver.vehiclePlate}</p>
          </div>
        </div>

        {/* Online / Offline Switch */}
        <button
          onClick={() => toggleDriverOnline(currentDriver.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            isOnline
              ? 'bg-[#005A2B] text-emerald-100 border border-emerald-500'
              : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </button>
      </div>

      {/* Main Driver Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-900 text-neutral-100 text-xs relative">
        {/* INCOMING RIDE REQUEST MODAL (15-second SLA invite) */}
        {driverInviteActive && activeTrip && (
          <div className="absolute inset-x-3 top-3 z-30 bg-[#1A1A1A] border-2 border-[#FFC107] rounded-3xl p-4 shadow-2xl space-y-3.5 animate-pulse">
            {/* Header with Countdown Ring */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#FFC107] text-[#1A1A1A]">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Nova Corrida Go!</h3>
                  <p className="text-[10px] text-amber-300">Convite prioritário Geohash</p>
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="w-10 h-10 rounded-full bg-neutral-900 border-2 border-[#FFC107] flex items-center justify-center font-mono font-black text-sm text-[#FFC107]">
                {driverInviteCountdown}s
              </div>
            </div>

            {/* Trip Details & Earnings in AOA */}
            <div className="bg-neutral-900/90 rounded-2xl p-3 space-y-2 border border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">Ganhos do Motorista (85%):</span>
                <span className="font-mono font-black text-base text-[#FFC107]">
                  {formatAOA(Math.round(activeTrip.priceAOA * 0.85))}
                </span>
              </div>

              <div className="pt-2 border-t border-neutral-800 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Embarque: <strong>{activeTrip.origin.name}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Destino: <strong>{activeTrip.destination.name}</strong></span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-neutral-400 pt-1">
                  <span>Distância: <strong className="text-white">{activeTrip.distanceKm} km</strong></span>
                  <span>Categoria: <strong className="text-white">{activeTrip.category.name}</strong></span>
                </div>
              </div>
            </div>

            {/* Accept Button */}
            <button
              onClick={acceptTripAsDriver}
              className="w-full py-3 rounded-2xl bg-[#005A2B] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 hover:bg-[#004822] active:scale-[0.98] transition-all"
            >
              <CheckCircle2 className="w-5 h-5 text-[#FFC107]" />
              <span>ACEITAR CORRIDA ({driverInviteCountdown}s)</span>
            </button>
          </div>
        )}

        {/* DRIVER WALLET & EARNINGS CARD */}
        <div className="bg-gradient-to-br from-neutral-800/90 to-neutral-900 border border-neutral-700/80 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-neutral-400 text-[11px]">
            <span className="flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-[#FFC107]" />
              <span>Saldo da Carteira Motorista</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">Ledger Central</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="font-mono font-extrabold text-xl text-white">
              {formatAOA(currentDriver.walletBalanceAOA)}
            </div>
            <div className="text-[11px] text-neutral-400">
              Total Corridas: <strong className="text-white font-mono">{currentDriver.totalTrips}</strong>
            </div>
          </div>
        </div>

        {/* ACTIVE TRIP PROGRESSION (When accepted) */}
        {activeTrip && ['driver_en_route', 'driver_arrived', 'in_progress'].includes(activeTrip.status) && (
          <div className="bg-neutral-800/90 border border-neutral-700 rounded-2xl p-3.5 space-y-3 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-700">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-xs text-white">Viagem em Curso</span>
              </div>
              <span className="font-mono text-xs text-[#FFC107] font-bold">
                {formatAOA(Math.round(activeTrip.priceAOA * 0.85))}
              </span>
            </div>

            {/* Passenger info */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-neutral-400">Passageiro:</div>
                <div className="font-bold text-xs text-white">{activeTrip.passengerName}</div>
                {activeTrip.entityName && (
                  <div className="text-[10px] text-amber-300">Recolha: {activeTrip.entityName}</div>
                )}
              </div>
              <a
                href={`tel:${activeTrip.passengerPhone}`}
                className="flex items-center gap-1 bg-neutral-700 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold text-white hover:bg-neutral-600"
              >
                <Phone className="w-3 h-3 text-[#FFC107]" />
                <span>Ligar</span>
              </a>
            </div>

            {/* DESTINO VIVO SYNCHRONIZATION ALERT */}
            {activeTrip.isDestinoVivo && (
              <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-2 text-[10px] text-emerald-300 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#FFC107] shrink-0" />
                <span>Destino Vivo: Rota sincronizada automaticamente com o pino do passageiro.</span>
              </div>
            )}

            {/* Step-by-Step Action Controls */}
            <div className="space-y-2 pt-1">
              {activeTrip.status === 'driver_en_route' && (
                <button
                  onClick={driverArrivedAtPickup}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Cheguei no Local de Embarque</span>
                </button>
              )}

              {activeTrip.status === 'driver_arrived' && (
                <button
                  onClick={startTripProgression}
                  className="w-full py-2.5 rounded-xl bg-[#005A2B] hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Navigation className="w-4 h-4 text-[#FFC107]" />
                  <span>Iniciar Corrida com Passageiro</span>
                </button>
              )}

              {activeTrip.status === 'in_progress' && (
                <div className="space-y-2">
                  <button
                    onClick={submitDriverTripStopDeclaration}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Concluir Corrida (Assinatura Local)</span>
                  </button>

                  <div className="flex items-center gap-1.5 p-2 bg-neutral-900/90 rounded-xl border border-neutral-700 text-[10px] text-neutral-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Autoridade Central:</strong> Tarifa final validada pelo servidor com piso mínimo de 500 Kz.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DEAD RECKONING & GPS INTEGRITY CONTROLS */}
        <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulador GPS Adaptativo</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold">{currentDriver.speedKmH} km/h</span>
          </div>

          {/* Speed slider */}
          <input
            type="range"
            min="0"
            max="80"
            step="5"
            value={currentDriver.speedKmH}
            onChange={(e) => updateDriverGpsSpeed(currentDriver.id, Number(e.target.value))}
            className="w-full accent-[#005A2B] cursor-pointer"
          />

          <div className="bg-neutral-900/90 rounded-xl p-2 text-[10px] space-y-1 text-neutral-400 border border-neutral-800">
            <div className="flex justify-between">
              <span>Taxa de Atualização:</span>
              <span className="font-mono text-[#FFC107] font-bold">{gpsRule.intervalSec}s ({gpsRule.state})</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-neutral-800">
              <span>Perda de Sinal GNSS (Túnel/Sombra):</span>
              <button
                onClick={() => simulateGpsSignalLoss(!isGpsSignalLost)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  isGpsSignalLost
                    ? 'bg-amber-500 text-black'
                    : 'bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                {isGpsSignalLost ? 'SIMULANDO PERDA' : 'SIMULAR PERDA'}
              </button>
            </div>

            {isGpsSignalLost && (
              <div className="p-2 mt-1 rounded bg-amber-950/60 border border-amber-500/40 text-[10px] text-amber-200 space-y-0.5">
                <div className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  <span>Estado: {driverGpsConfidence}</span>
                </div>
                <div>Tempo sem sinal: <strong>{driverDeadReckoningSec}s</strong> / Limite: 15s (200m)</div>
                {driverDeadReckoningSec > 15 && (
                  <div className="text-red-300 font-semibold">Incerteza congelada. Odômetro tarifado interrompido.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RESILIENT STORAGE & LOCAL SYNC QUEUE */}
        <div className="bg-neutral-800/50 border border-neutral-700/60 rounded-xl p-2.5 text-[10px] text-neutral-400 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Storage Local:</span>
            </span>
            <span className="font-mono text-emerald-300 font-bold">Flutter SQLCipher</span>
          </div>
          <div className="flex justify-between">
            <span>Fila Offline Pendente:</span>
            <span className="font-mono text-white font-bold">{offlineSyncQueue.length} eventos</span>
          </div>
          <div className="flex justify-between text-[9px] text-neutral-500 pt-1 border-t border-neutral-800">
            <span>Revogação de Sessão:</span>
            <span>Época Token (Zero Redis)</span>
          </div>
        </div>
      </div>

      {/* Driver Footer */}
      <div className="p-3 bg-neutral-950 border-t border-neutral-800 shrink-0 text-center text-[10px] text-neutral-500">
        RIDING.ao Motorista v1.0 • Luanda, Angola
      </div>
    </DeviceViewportWrapper>
  );
};
