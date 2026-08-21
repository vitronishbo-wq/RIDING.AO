import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { Car, Fingerprint, Lock, CheckCircle2, AlertCircle, X } from 'lucide-react';

export const DriverAuthModal: React.FC = () => {
  const { driverAuthModalOpen, setDriverAuthModalOpen, authenticateDriver } = useSystem();
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  if (!driverAuthModalOpen) return null;

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setIsVerifying(true);

    setTimeout(() => {
      const res = authenticateDriver(pin, false);
      setIsVerifying(false);
      if (!res.success) {
        setErrorMessage(res.error || 'PIN de motorista incorreto.');
      }
    }, 400);
  };

  const handleBiometricAuth = () => {
    setErrorMessage(null);
    setIsVerifying(true);
    setTimeout(() => {
      const res = authenticateDriver('', true);
      setIsVerifying(false);
      if (!res.success) {
        setErrorMessage(res.error || 'Autenticação biométrica não autorizada.');
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-white">
        {/* Modal Header */}
        <div className="bg-neutral-950 px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#005A2B] border border-emerald-500/40 flex items-center justify-center text-[#FFC107]">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Portal do Motorista</h3>
              <p className="text-[11px] text-neutral-400">Autenticação de Parceiro</p>
            </div>
          </div>
          <button
            onClick={() => {
              setDriverAuthModalOpen(false);
              setPin('');
              setErrorMessage(null);
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          <form onSubmit={handlePinSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] text-neutral-300 font-medium mb-1.5">
                PIN de Acesso:
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-center font-mono text-lg tracking-widest text-white placeholder-neutral-600 focus:outline-none focus:border-[#005A2B]"
                />
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3.5" />
              </div>
            </div>

            {errorMessage && (
              <p className="text-[11px] text-red-400 flex items-center gap-1.5 bg-red-950/40 p-2 rounded-xl border border-red-900/50">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={isVerifying || pin.length < 4}
              className="w-full py-3 rounded-2xl bg-[#005A2B] hover:bg-[#004822] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all"
            >
              {isVerifying ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#FFC107]" />
                  <span>Aceder ao Cockpit</span>
                </>
              )}
            </button>
          </form>

          {/* Biometric Alternative */}
          <div className="pt-3 border-t border-neutral-800 text-center space-y-2">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Ou autentique via</span>
            <button
              onClick={handleBiometricAuth}
              disabled={isVerifying}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 border border-neutral-700 transition-colors"
            >
              <Fingerprint className="w-4 h-4 text-emerald-400" />
              <span>Face ID / Impressão Digital</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
