import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import {
  Shield,
  Fingerprint,
  Key,
  Lock,
  Zap,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';

export const HiddenEntryModal: React.FC = () => {
  const {
    hiddenEntryModalOpen,
    setHiddenEntryModalOpen,
    escalatePrivileges,
    currentIdentity
  } = useSystem();

  const [activeMethod, setActiveMethod] = useState<'biometric' | 'debug_code' | 'token'>('biometric');
  const [debugSequenceInput, setDebugSequenceInput] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [challengeSuccess, setChallengeSuccess] = useState<boolean>(false);

  if (!hiddenEntryModalOpen) return null;

  const handleSimulateBiometric = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setChallengeSuccess(true);
      setTimeout(() => {
        escalatePrivileges('biometric_challenge');
        setChallengeSuccess(false);
      }, 600);
    }, 1000);
  };

  const handleDebugCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      escalatePrivileges('debug_sequence');
    }, 800);
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      escalatePrivileges('dev_token');
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#005A2B] text-[#FFC107] border border-emerald-500/40 shadow-inner">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  Privilege Escalation Engine
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">Desafio de Elevação de Privilégios</h3>
            </div>
          </div>
          <button
            onClick={() => setHiddenEntryModalOpen(false)}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Identity & Context Banner */}
        <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-xs space-y-1">
          <div className="text-neutral-400">Identidade Atual:</div>
          <div className="font-bold text-white flex items-center justify-between">
            <span>{currentIdentity.name} ({currentIdentity.type})</span>
            <span className="text-neutral-500 font-mono text-[10px]">Zero Hardcoded Credentials</span>
          </div>
          <p className="text-[11px] text-neutral-400 pt-1">
            A elevação concederá <strong>ALL_PERMISSIONS</strong> temporariamente (60 segundos) com registro imutável em auditoria contábil.
          </p>
        </div>

        {/* Method Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 text-xs font-mono">
          <button
            onClick={() => setActiveMethod('biometric')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeMethod === 'biometric'
                ? 'bg-[#005A2B] text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Fingerprint className="w-4 h-4 text-[#FFC107]" />
            <span>Biometria</span>
          </button>

          <button
            onClick={() => setActiveMethod('debug_code')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeMethod === 'debug_code'
                ? 'bg-[#005A2B] text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Sequência</span>
          </button>

          <button
            onClick={() => setActiveMethod('token')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeMethod === 'token'
                ? 'bg-[#005A2B] text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Dev Token</span>
          </button>
        </div>

        {/* Method Content */}
        {activeMethod === 'biometric' && (
          <div className="space-y-4 text-center py-4">
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className={`absolute inset-0 rounded-full border-2 ${isVerifying ? 'border-emerald-500 animate-ping' : 'border-neutral-700'}`} />
              <button
                onClick={handleSimulateBiometric}
                disabled={isVerifying || challengeSuccess}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  challengeSuccess
                    ? 'bg-emerald-600 text-white scale-105'
                    : isVerifying
                    ? 'bg-emerald-950 text-emerald-400'
                    : 'bg-neutral-800 hover:bg-[#005A2B] text-[#FFC107] hover:scale-105'
                }`}
              >
                {challengeSuccess ? (
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                ) : (
                  <Fingerprint className="w-10 h-10" />
                )}
              </button>
            </div>

            <div>
              <p className="text-sm font-bold text-white">
                {isVerifying
                  ? 'Verificando Hardware Enclave Biométrico...'
                  : challengeSuccess
                  ? 'Desafio Aprovado! Emitindo Token Founder...'
                  : 'Toque no sensor biométrico para autenticar'}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Autenticação local do dispositivo intermediada pelo Authentication Gateway
              </p>
            </div>
          </div>
        )}

        {activeMethod === 'debug_code' && (
          <form onSubmit={handleDebugCodeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1">
                Sequência de Debug / Gesture Pattern:
              </label>
              <input
                type="text"
                value={debugSequenceInput}
                onChange={(e) => setDebugSequenceInput(e.target.value)}
                placeholder="Ex: UP-DOWN-TAP-TAP-DEV"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-[#005A2B]"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 rounded-2xl bg-[#005A2B] hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4 text-[#FFC107]" />
              <span>Validar Sequência e Escalar</span>
            </button>
          </form>
        )}

        {activeMethod === 'token' && (
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1">
                Ephemeral Developer Token (Injetado via Vault / KMS):
              </label>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="dev_ephemeral_vault_token_..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-[#005A2B]"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 rounded-2xl bg-[#005A2B] hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Key className="w-4 h-4 text-[#FFC107]" />
              <span>Validar Token com Vault</span>
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <span>SLA Challenge: &lt; 80ms</span>
          <span>Auto-Timeout: 60s</span>
        </div>
      </div>
    </div>
  );
};
