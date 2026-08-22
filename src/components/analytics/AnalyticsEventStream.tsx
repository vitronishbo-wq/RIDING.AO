import React, { useState } from 'react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { useSystem } from '../../context/SystemContext';
import { AnalyticsEvent } from '../../types/architecture';
import { Activity, CheckCircle2, Copy, Check, Filter, ShieldCheck, Clock, Terminal } from 'lucide-react';

const OFFICIAL_EVENT_NAMES = [
  'app_opened',
  'trip_requested',
  'driver_accepted',
  'driver_arrived',
  'trip_started',
  'trip_finished',
  'payment_completed',
  'wallet_updated',
  'user_rated'
];

export const AnalyticsEventStream: React.FC = () => {
  const { analyticsEvents } = useSystem();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const { copiedKey, copyToClipboard } = useCopyToClipboard<string>();

  const filteredEvents =
    selectedFilter === 'all'
      ? analyticsEvents
      : analyticsEvents.filter((e) => e.eventName === selectedFilter);

  const handleCopyEvent = (id: string, payload: AnalyticsEvent['payload']) => {
    copyToClipboard(id, JSON.stringify(payload, null, 2));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#005A2B] text-[#FFC107]">
                <Activity className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white">
                Pipeline de Analytics & Auditoria (Capítulo 13)
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Catálogo estrito e imutável de <strong>exatamente 9 eventos oficiais</strong> para auditoria contábil e telemetria.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-neutral-300 bg-neutral-950 px-3.5 py-2 rounded-2xl border border-neutral-800">
            <span>Eventos Capturados:</span>
            <strong className="text-emerald-400 font-bold">{analyticsEvents.length}</strong>
          </div>
        </div>
      </div>

      {/* 9 Official Events Badges & Filter */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>Filtrar por Evento Homologado (9)</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              selectedFilter === 'all'
                ? 'bg-[#005A2B] text-white border border-emerald-500'
                : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            TODOS ({analyticsEvents.length})
          </button>

          {OFFICIAL_EVENT_NAMES.map((name, index) => {
            const count = analyticsEvents.filter((e) => e.eventName === name).length;
            const isSelected = selectedFilter === name;
            return (
              <button
                key={name}
                onClick={() => setSelectedFilter(name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                  isSelected
                    ? 'bg-[#FFC107] text-[#1A1A1A] font-bold shadow-md'
                    : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                <span className="font-bold text-[10px] text-neutral-500">#{index + 1}</span>
                <span>{name}</span>
                {count > 0 && (
                  <span className="bg-black/30 px-1.5 py-0.2 rounded text-[10px] font-bold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Stream Feed */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#FFC107]" />
          <span>Fluxo Cronológico de Telemetria em Tempo Real</span>
        </h3>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-2 transition-all hover:border-neutral-700"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-mono font-bold text-xs text-[#FFC107]">
                    {evt.eventName}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded">
                    {evt.id}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-neutral-400 text-[11px]">{evt.timestamp}</span>
                  <button
                    onClick={() => handleCopyEvent(evt.id, evt.payload)}
                    className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white"
                  >
                    {copiedKey === evt.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Payload Box */}
              <div className="bg-black/80 rounded-xl p-3 font-mono text-xs text-emerald-400 overflow-x-auto">
                <pre>{JSON.stringify(evt.payload, null, 2)}</pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
