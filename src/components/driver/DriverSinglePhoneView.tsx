import React from 'react';
import { DriverApp } from '../simulator/DriverApp';
import { useSystem } from '../../context/SystemContext';
import { ArrowLeft, Car, ShieldCheck, Power } from 'lucide-react';

export const DriverSinglePhoneView: React.FC = () => {
  const { lockAndReturnToPublic, currentIdentity } = useSystem();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-4 animate-in fade-in duration-300">
      {/* Top Driver Bar */}
      <div className="w-full max-w-[360px] mb-3 flex items-center justify-between">
        <button
          onClick={lockAndReturnToPublic}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Passageiro</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cockpit Motorista Ativo</span>
        </div>
      </div>

      {/* The Single Smartphone Frame for Driver */}
      <div className="w-full max-w-[360px]">
        <DriverApp />
      </div>
    </div>
  );
};
