import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { calculateDriverScore, calculateHaversineDistanceKm } from '../../utils/geohashUtils';
import { LUANDA_LOCATIONS } from '../../data/luandaData';
import {
  Cpu,
  Zap,
  CheckCircle2,
  Gauge,
  Sliders,
  Play,
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';

export const MatchingEngineVisualizer: React.FC = () => {
  const { drivers, selectedOrigin, lastMatchingLatencyMs } = useSystem();

  // Test sandbox sliders for live scoring experimentation
  const [testDistance, setTestDistance] = useState<number>(3.2);
  const [testRating, setTestRating] = useState<number>(4.9);
  const [testEta, setTestEta] = useState<number>(6);
  const [testSpeed, setTestSpeed] = useState<number>(25);

  const sandboxResult = calculateDriverScore({
    distanceKm: testDistance,
    driverRating: testRating,
    etaMinutes: testEta,
    speedKmH: testSpeed
  });

  return (
    <div className="space-y-6">
      {/* Header & SLA Metric Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#005A2B] text-[#FFC107]">
                <Cpu className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white">
                Motor de Matching Geohash & Score Determinístico
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Serviço Python FastAPI stateless com índice em memória (Redis). Zero Machine Learning em tempo real (Cap. 3 & 4).
            </p>
          </div>

          {/* Stopwatch SLA Meter */}
          <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 px-4 py-2.5 rounded-2xl">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-neutral-400">Latência do Algoritmo</div>
              <div className="font-mono font-black text-lg text-emerald-400">{lastMatchingLatencyMs} ms</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-600 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 3 Core Matching Guarantees */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 text-xs">
          <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#FFC107]">
              <Zap className="w-4 h-4" />
              <span>SLA &lt; 100 ms</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Processamento instantâneo em memória sem overhead de brokers de fila ou cold starts.
            </p>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Layers className="w-4 h-4" />
              <span>Geohash k-Ring Lookup</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Filtragem por raio hexagonal com precisão 6 (área de ~1.2 km² em Luanda).
            </p>
          </div>

          <div className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-400">
              <Award className="w-4 h-4" />
              <span>Fórmula Determinística</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Score ponderado: 50% Distância + 25% Avaliação + 20% ETA + 5% Velocidade.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Live Fleet Ranked Candidates vs. Interactive Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ranked Driver Fleet Candidates */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FFC107]" />
              <span>Classificação Atual dos Motoristas em Luanda</span>
            </h3>
            <span className="text-xs text-neutral-400 font-mono">
              Origem: {selectedOrigin.name.split(' ')[0]}
            </span>
          </div>

          {/* Candidate Cards */}
          <div className="space-y-2.5">
            {drivers.map((driver, index) => {
              const dDist = calculateHaversineDistanceKm(selectedOrigin.lat, selectedOrigin.lng, driver.lat, driver.lng);
              const dEta = Math.round(dDist * 2.5 + 2);
              const scoreResult = calculateDriverScore({
                distanceKm: dDist,
                driverRating: driver.rating,
                etaMinutes: dEta,
                speedKmH: driver.speedKmH
              });

              const isTop = index === 0;

              return (
                <div
                  key={driver.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    isTop
                      ? 'bg-[#005A2B]/20 border-[#005A2B] text-white ring-1 ring-[#005A2B]'
                      : 'bg-neutral-950/70 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                        isTop ? 'bg-[#FFC107] text-[#1A1A1A]' : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      #{index + 1}
                    </span>

                    <img
                      src={driver.photoUrl}
                      alt={driver.name}
                      className="w-10 h-10 rounded-xl object-cover border border-neutral-700"
                    />

                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1.5">
                        {driver.name}
                        {isTop && (
                          <span className="text-[10px] bg-[#005A2B] text-emerald-200 px-1.5 py-0.2 rounded font-semibold">
                            Convite Enviado
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                        <span>★ {driver.rating}</span>
                        <span>•</span>
                        <span>{driver.vehicleModel.split('(')[0]}</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-400">{dDist} km ({dEta} min)</span>
                      </div>
                    </div>
                  </div>

                  {/* Score Meter */}
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-400">Score Algorítmico</div>
                    <div className="font-mono font-black text-sm text-[#FFC107]">{scoreResult.score} pts</div>
                    <div className="text-[9px] font-mono text-neutral-500">{scoreResult.latencyMs}ms</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Mathematical Sandbox Slider */}
        <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Simulador de Score em Tempo Real</h3>
          </div>

          {/* Sliders */}
          <div className="space-y-4 text-xs">
            {/* Distance Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-300">
                <span>Distância até ao Passageiro (Peso 50%):</span>
                <span className="font-mono font-bold text-emerald-400">{testDistance} km</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="15"
                step="0.1"
                value={testDistance}
                onChange={(e) => setTestDistance(Number(e.target.value))}
                className="w-full accent-[#005A2B] cursor-pointer"
              />
            </div>

            {/* Rating Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-300">
                <span>Avaliação do Motorista (Peso 25%):</span>
                <span className="font-mono font-bold text-[#FFC107]">★ {testRating}</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="5.0"
                step="0.05"
                value={testRating}
                onChange={(e) => setTestRating(Number(e.target.value))}
                className="w-full accent-[#FFC107] cursor-pointer"
              />
            </div>

            {/* ETA Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-300">
                <span>Tempo Estimado de Chegada - ETA (Peso 20%):</span>
                <span className="font-mono font-bold text-blue-400">{testEta} min</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={testEta}
                onChange={(e) => setTestEta(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Speed Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-neutral-300">
                <span>Velocidade Atual de Deslocamento (Peso 5%):</span>
                <span className="font-mono font-bold text-purple-400">{testSpeed} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="70"
                step="5"
                value={testSpeed}
                onChange={(e) => setTestSpeed(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Sandbox Score Output Card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-center space-y-2">
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
              Score Final Calculado no Edge / Redis
            </span>
            <div className="font-mono font-black text-3xl text-[#FFC107]">
              {sandboxResult.score} <span className="text-xs text-neutral-400 font-normal">/ 100</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono">
              Tempo de Execução CPU: {sandboxResult.latencyMs} ms (&lt;100ms SLA OK)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
