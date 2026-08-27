/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RIDING.ao - SPA 404 & Route Recovery Fallback Component
 * Gracefully captures unmapped URL routes, informs the user, and provides
 * 1-click safe redirection to canonical application views.
 */

import React, { useState, useEffect } from 'react';
import { Compass, Smartphone, Car, ShieldAlert, ArrowRight, RotateCcw } from 'lucide-react';
import { navigateToSpa } from '../../utils/spaRouter';

interface SpaNotFoundFallbackProps {
  attemptedPath: string;
  onNavigateHome: () => void;
}

export const SpaNotFoundFallback: React.FC<SpaNotFoundFallbackProps> = ({
  attemptedPath,
  onNavigateHome
}) => {
  const [countdown, setCountdown] = useState<number>(8);
  const [autoRedirectCancelled, setAutoRedirectCancelled] = useState<boolean>(false);

  useEffect(() => {
    if (autoRedirectCancelled) return;
    if (countdown <= 0) {
      onNavigateHome();
      navigateToSpa('/passenger', { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, autoRedirectCancelled, onNavigateHome]);

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Icon & Status */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '10s' }} />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>404 • Rota Não Encontrada no SPA</span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            Destino Digital Não Mapeado
          </h2>

          <p className="text-xs text-neutral-400 leading-relaxed">
            O endereço que tentou aceder não corresponde a uma rota ativa da malha operacional da RIDING.ao.
          </p>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 font-mono text-xs text-amber-300 break-all">
            {attemptedPath || window.location.pathname}
          </div>
        </div>

        {/* Auto-redirect alert */}
        {!autoRedirectCancelled ? (
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-3 text-xs text-neutral-400 flex items-center justify-between">
            <span>Redirecionando em <strong className="text-emerald-400 font-mono">{countdown}s</strong>...</span>
            <button
              onClick={() => setAutoRedirectCancelled(true)}
              className="text-[11px] text-amber-400 hover:underline font-mono"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-neutral-500 font-mono">
            Redirecionamento automático cancelado. Escolha um destino abaixo:
          </div>
        )}

        {/* Destination Shortcuts */}
        <div className="space-y-2 text-left">
          <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
            Rotas Canónicas Disponíveis:
          </span>

          <button
            onClick={() => {
              onNavigateHome();
              navigateToSpa('/passenger');
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-neutral-950 hover:bg-[#005A2B] border border-neutral-800 hover:border-emerald-600 text-white transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-800 group-hover:text-white">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Portal do Passageiro</div>
                <div className="text-[10px] text-neutral-400 group-hover:text-emerald-100 font-mono">/passenger ou /</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => {
              navigateToSpa('/driver');
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-[#FFC107]">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Cockpit do Motorista</div>
                <div className="text-[10px] text-neutral-400 font-mono">/driver</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => {
              navigateToSpa('/master/shell');
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-white transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-sky-400">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Console Master RIDING.ao</div>
                <div className="text-[10px] text-neutral-400 font-mono">/master/shell</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>
    </div>
  );
};
