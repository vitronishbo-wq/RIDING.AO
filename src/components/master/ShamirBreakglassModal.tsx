import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { ShieldAlert, KeyRound, Lock, CheckCircle2, AlertTriangle, X, Terminal, Cpu } from 'lucide-react';
import { ShamirShareKey } from '../../types/architecture';
import { ModalShell } from '../common/ModalShell';

const SHAMIR_PRESET_SHARES: ShamirShareKey[] = [
  {
    index: 1,
    label: 'Fragmento 1 (Founder Hardware)',
    holder: 'Founder Key (Hardware)',
    hashFragment: '9f8a7c2b3e4d5a1f8902c3b4a5d6e7f8'
  },
  {
    index: 2,
    label: 'Fragmento 2 (Diretor de Operações)',
    holder: 'Ops Director (Escrow)',
    hashFragment: 'a1b2c3d4e5f60718293a4b5c6d7e8f90'
  },
  {
    index: 3,
    label: 'Fragmento 3 (KMS Cold Disaster Recovery)',
    holder: 'KMS Cold Disaster Recovery',
    hashFragment: 'e5f6a7b8c9d0123456789abcdef01234'
  }
];

export const ShamirBreakglassModal: React.FC = () => {
  const { shamirBreakglassOpen, setShamirBreakglassOpen, executeShamirBreakglass } = useSystem();
  const [selectedShare1, setSelectedShare1] = useState<string>(SHAMIR_PRESET_SHARES[0].hashFragment);
  const [selectedShare2, setSelectedShare2] = useState<string>(SHAMIR_PRESET_SHARES[1].hashFragment);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!shamirBreakglassOpen) return null;

  const handleExecuteRecovery = () => {
    setStatusMessage(null);
    const result = executeShamirBreakglass(selectedShare1, selectedShare2);
    if (!result.success) {
      setStatusMessage({ text: result.message, isError: true });
    } else {
      setStatusMessage({ text: result.message, isError: false });
    }
  };

  return (
    <ModalShell
      header={
        <div className="bg-neutral-950 px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-950/80 border border-red-500 flex items-center justify-center text-red-400 shadow-lg shadow-red-950">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Protocolo Break-Glass (Shamir 2 de 3)</h3>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono text-[9px] font-bold border border-red-500/40">
                  DISASTER RECOVERY
                </span>
              </div>
              <p className="text-xs text-neutral-400">Recuperação de Emergência de Acesso Root</p>
            </div>
          </div>
          <button
            onClick={() => setShamirBreakglassOpen(false)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      }
      onClose={() => setShamirBreakglassOpen(false)}
      overlayClassName="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      panelClassName="bg-neutral-900 border-2 border-red-500/80 rounded-3xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-white"
      contentClassName="p-6 space-y-4 text-xs"
      closeButtonClassName="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
      maxWidthClassName="max-w-lg"
      footer={
        <div className="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
          <span>SHAMIR SECRET SHARING • ED25519</span>
          <span>AUDIT LOG OBRIGATÓRIO</span>
        </div>
      }
    >
          <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-neutral-400">
              <span>Limiar Criptográfico Exigido:</span>
              <span className="font-mono text-[#FFC107] font-bold">2 de 3 Fragmentos</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Nenhuma pessoa isolada detém a chave mestra. Para restabelecer os privilégios de <strong>Superadmin Founder</strong> sem intervenção externa, é obrigatório combinar pelo menos 2 fragmentos válidos.
            </p>
          </div>

          {/* Share 1 Selector */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#FFC107]" />
              <span>Apresentar 1º Fragmento:</span>
            </label>
            <div className="space-y-1">
              <select
                value={selectedShare1}
                onChange={(e) => setSelectedShare1(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white font-mono"
              >
                {SHAMIR_PRESET_SHARES.map((s) => (
                  <option key={s.index} value={s.hashFragment}>
                    {s.label} • {s.holder}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={selectedShare1}
                onChange={(e) => setSelectedShare1(e.target.value)}
                className="w-full bg-black/60 border border-neutral-800/80 rounded-lg p-1.5 text-[10px] text-neutral-400 font-mono"
              />
            </div>
          </div>

          {/* Share 2 Selector */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span>Apresentar 2º Fragmento:</span>
            </label>
            <div className="space-y-1">
              <select
                value={selectedShare2}
                onChange={(e) => setSelectedShare2(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white font-mono"
              >
                {SHAMIR_PRESET_SHARES.map((s) => (
                  <option key={s.index} value={s.hashFragment}>
                    {s.label} • {s.holder}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={selectedShare2}
                onChange={(e) => setSelectedShare2(e.target.value)}
                className="w-full bg-black/60 border border-neutral-800/80 rounded-lg p-1.5 text-[10px] text-neutral-400 font-mono"
              />
            </div>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                statusMessage.isError
                  ? 'bg-red-950/60 border-red-800 text-red-200'
                  : 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
              }`}
            >
              {statusMessage.isError ? (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleExecuteRecovery}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950 active:scale-[0.98] transition-all"
          >
            <Cpu className="w-4 h-4" />
            <span>Reconstruir Chave & Ativar Sessão Temporária (60 Min)</span>
          </button>
    </ModalShell>
  );
};
