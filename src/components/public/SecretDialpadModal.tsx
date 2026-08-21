import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Delete, X, ShieldAlert, KeyRound } from 'lucide-react';

export const SecretDialpadModal: React.FC = () => {
  const { triggerDialpadOpen, setTriggerDialpadOpen, submitDialpadCode } = useSystem();
  const [dialedDigits, setDialedDigits] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  if (!triggerDialpadOpen) return null;

  const handleDigitPress = (char: string) => {
    setErrorNotice(null);
    if (dialedDigits.length < 12) {
      const next = dialedDigits + char;
      setDialedDigits(next);
      // Auto-trigger if recognized code entered
      if (next === '*#7668#' || next === '*#1357#' || next === '135790') {
        const success = submitDialpadCode(next);
        if (success) {
          setDialedDigits('');
        }
      }
    }
  };

  const handleBackspace = () => {
    setErrorNotice(null);
    setDialedDigits((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setErrorNotice(null);
    setDialedDigits('');
  };

  const handleManualSubmit = () => {
    const success = submitDialpadCode(dialedDigits);
    if (success) {
      setDialedDigits('');
    } else {
      setErrorNotice('Código não reconhecido.');
    }
  };

  const dialKeys = [
    { key: '1', sub: '' },
    { key: '2', sub: 'ABC' },
    { key: '3', sub: 'DEF' },
    { key: '4', sub: 'GHI' },
    { key: '5', sub: 'JKL' },
    { key: '6', sub: 'MNO' },
    { key: '7', sub: 'PQRS' },
    { key: '8', sub: 'TUV' },
    { key: '9', sub: 'WXYZ' },
    { key: '*', sub: '' },
    { key: '0', sub: '+' },
    { key: '#', sub: '' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-neutral-950 px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Terminal do Dispositivo</h3>
              <p className="text-[11px] text-neutral-400">Teclado de Acesso</p>
            </div>
          </div>
          <button
            onClick={() => {
              setTriggerDialpadOpen(false);
              setDialedDigits('');
              setErrorNotice(null);
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display Area */}
        <div className="p-5 bg-neutral-950/60 border-b border-neutral-800/80 text-center">
          <div className="h-12 flex items-center justify-center font-mono text-2xl tracking-widest text-emerald-400 font-bold">
            {dialedDigits ? (
              dialedDigits.replace(/./g, '•')
            ) : (
              <span className="text-neutral-600 text-sm font-normal">••••••</span>
            )}
          </div>
          {errorNotice && (
            <p className="text-[11px] text-red-400 mt-1 flex items-center justify-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              <span>{errorNotice}</span>
            </p>
          )}
        </div>

        {/* Keypad Grid */}
        <div className="p-5 bg-neutral-900">
          <div className="grid grid-cols-3 gap-3">
            {dialKeys.map((item) => (
              <button
                key={item.key}
                onClick={() => handleDigitPress(item.key)}
                className="h-14 rounded-2xl bg-neutral-800/80 hover:bg-neutral-700 active:scale-95 border border-neutral-700/60 text-white flex flex-col items-center justify-center transition-all shadow-sm"
              >
                <span className="text-lg font-bold leading-none">{item.key}</span>
                {item.sub && <span className="text-[8px] text-neutral-400 tracking-wider mt-0.5">{item.sub}</span>}
              </button>
            ))}
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-neutral-800">
            <button
              onClick={handleClear}
              className="py-2.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white text-xs font-semibold hover:bg-neutral-700 transition-colors"
            >
              Limpar
            </button>
            <button
              onClick={handleManualSubmit}
              className="py-2.5 rounded-xl bg-[#005A2B] text-white hover:bg-emerald-700 text-xs font-bold transition-colors shadow-md shadow-emerald-950 flex items-center justify-center gap-1"
            >
              <span>Verificar</span>
            </button>
            <button
              onClick={handleBackspace}
              className="py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold hover:bg-neutral-700 flex items-center justify-center transition-colors"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
