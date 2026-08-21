import React from 'react';
import { PassengerApp } from './PassengerApp';
import { DriverApp } from './DriverApp';
import { LuandaMapCanvas } from './LuandaMapCanvas';
import { useSystem } from '../../context/SystemContext';
import {
  Smartphone,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu
} from 'lucide-react';

export const DualAppSimulator: React.FC = () => {
  const { activeTrip, resetSimulation, lastMatchingLatencyMs } = useSystem();

  return (
    <div className="space-y-6">
      {/* Workbench Header & Sequence Flow Ribbon */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#005A2B] text-[#FFC107]">
                <Smartphone className="w-5 h-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Simulador Dual Mobile (Flutter 90% Código Compartilhado)
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Execução interativa ponta-a-ponta dos <strong>Fluxos A, B e C</strong> (Capítulo 7) com motor de matching geohash em Luanda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetSimulation}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Simulação</span>
            </button>
          </div>
        </div>

        {/* Live Architecture Flow Stepper (Capítulo 7) */}
        <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Fluxo A */}
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
              <span>FLUXO A: AUTH & INIT</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] text-neutral-400">
              App Init &rarr; Auth Cubit &rarr; Firebase Auth &rarr; Firestore Profile &rarr; Home Page.
            </p>
          </div>

          {/* Fluxo B */}
          <div
            className={`border rounded-xl p-3 space-y-1.5 transition-all ${
              activeTrip && activeTrip.status !== 'completed'
                ? 'bg-[#005A2B]/20 border-[#005A2B] text-white ring-1 ring-[#005A2B]'
                : 'bg-neutral-950/70 border-neutral-800 text-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-[#FFC107]">
              <span>FLUXO B: MATCHING GEOHASH</span>
              <span className="font-mono text-[10px] bg-black/40 px-1.5 py-0.5 rounded border border-neutral-700">
                {lastMatchingLatencyMs} ms
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Destino &rarr; Edge Price &rarr; Firestore (trip_requests) &rarr; Matching Stateless &rarr; Driver Accept &rarr; Active Trip.
            </p>
          </div>

          {/* Fluxo C */}
          <div
            className={`border rounded-xl p-3 space-y-1.5 transition-all ${
              activeTrip?.status === 'completed'
                ? 'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500'
                : 'bg-neutral-950/70 border-neutral-800 text-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-300">
              <span>FLUXO C: PAGAMENTO & SQL</span>
              {activeTrip?.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <p className="text-[11px] text-neutral-400">
              Trip Finished &rarr; PostgreSQL ACID Transaction &rarr; Wallet Update (AOA) &rarr; Analytics &rarr; Recibo.
            </p>
          </div>
        </div>
      </div>

      {/* 3-Column Responsive Workbench (Passenger App | Map & Telemetry | Driver App) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Passenger App */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div className="mb-2 text-xs font-bold text-neutral-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#005A2B]" />
            <span>Passageiro (Flutter UI)</span>
          </div>
          <PassengerApp />
        </div>

        {/* Column 2: Map & Realtime Geohash Dispatch Canvas */}
        <div className="lg:col-span-4 space-y-4">
          <div className="mb-2 text-xs font-bold text-neutral-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>MapLibre GL & Geohash Grid (Luanda)</span>
          </div>
          <LuandaMapCanvas />

          {/* Architecture Quick Notes */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-2 text-xs text-neutral-300">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#FFC107]" />
              <span>Conformidade com a Constituição V1.0</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-neutral-400 list-disc list-inside">
              <li>
                <strong>Edge Computing (Cap. 1):</strong> O cálculo de tarifa é feito 100% no cliente antes de submeter ao Firestore.
              </li>
              <li>
                <strong>SLA &lt; 100ms (Cap. 5):</strong> Motor de matching stateless sem filas bloqueantes (RabbitMQ/Kafka proibidos).
              </li>
              <li>
                <strong>GPS Adaptativo (Cap. 5):</strong> Taxa de atualização automática baseada no sensor de velocidade.
              </li>
            </ul>
          </div>
        </div>

        {/* Column 3: Driver App */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div className="mb-2 text-xs font-bold text-neutral-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FFC107]" />
            <span>Motorista (Flutter UI)</span>
          </div>
          <DriverApp />
        </div>
      </div>
    </div>
  );
};
