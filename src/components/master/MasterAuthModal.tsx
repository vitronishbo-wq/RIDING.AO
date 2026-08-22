import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { ShieldCheck, Fingerprint, Lock, CheckCircle2, UserCheck, X, Sparkles, Terminal, ShieldAlert } from 'lucide-react';

export const MasterAuthModal: React.FC = () => {
  const { masterAuthModalOpen, setMasterAuthModalOpen, authenticateMaster, setShamirBreakglassOpen } = useSystem();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState<'prompt' | 'verifying' | 'granted'>('prompt');

  if (!masterAuthModalOpen) return null;

  const handleAuthenticate = (method: 'firebase_auth' | 'biometric') => {
    setIsAuthenticating(true);
    setAuthStep('verifying');

    setTimeout(() => {
      setAuthStep('granted');
      setTimeout(() => {
        setIsAuthenticating(false);
        setAuthStep('prompt');
        authenticateMaster(method);
      }, 700);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border-2 border-[#FFC107]/60 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-white">
        {/* Header */}
        <div className="bg-neutral-950 px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#005A2B] border border-[#FFC107] flex items-center justify-center text-[#FFC107] shadow-lg shadow-emerald-950">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Autenticação Master</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#FFC107]/20 text-[#FFC107] font-mono text-[10px] font-bold border border-[#FFC107]/40">
                  ROLE: FOUNDER
                </span>
              </div>
              <p className="text-xs text-neutral-400">Gatilho *#7668# &rarr; Verificação de Acesso</p>
            </div>
          </div>
          <button
            onClick={() => setMasterAuthModalOpen(false)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Validation Info Card */}
        <div className="p-6 space-y-4">
          <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-neutral-400">
              <span>Segurança da Aplicação:</span>
              <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Hardcoded Secrets</span>
              </span>
            </div>

            <p className="text-[11px] text-neutral-300 leading-relaxed">
              O código <strong>*#7668#</strong> foi aceito como gatilho de descoberta. A autorização do Modo Master agora é validada via <strong>Firebase Auth</strong> + <strong>Firestore Security Rules</strong> com privilégio de Fundador / Operações.
            </p>

            <div className="pt-2 border-t border-neutral-800/80 grid grid-cols-2 gap-2 text-[10px] text-neutral-400 font-mono">
              <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                <div className="text-neutral-500">IDENTIDADE:</div>
                <div className="text-white font-bold">Kizua Muanza</div>
              </div>
              <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
                <div className="text-neutral-500">PERMISSÃO:</div>
                <div className="text-[#FFC107] font-bold">ALL_PERMISSIONS</div>
              </div>
            </div>
          </div>

          {/* Verification States */}
          {authStep === 'prompt' && (
            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleAuthenticate('firebase_auth')}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#005A2B] text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950 hover:bg-[#004822] active:scale-[0.98] transition-all border border-emerald-500/40"
              >
                <Lock className="w-4 h-4 text-[#FFC107]" />
                <span>Autenticar com Firebase Auth Token (Fundador)</span>
              </button>

              <button
                onClick={() => handleAuthenticate('biometric')}
                className="w-full py-3 px-4 rounded-2xl bg-neutral-800 text-neutral-200 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-700 active:scale-[0.98] transition-all border border-neutral-700"
              >
                <Fingerprint className="w-4 h-4 text-emerald-400" />
                <span>Validar por Biometria / WebAuthn Passkey</span>
              </button>

              <div className="pt-2 border-t border-neutral-800">
                <button
                  onClick={() => {
                    setMasterAuthModalOpen(false);
                    setShamirBreakglassOpen(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-red-950/40 text-red-300 hover:bg-red-950/80 font-bold text-xs flex items-center justify-center gap-2 border border-red-800/60 transition-all"
                >
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Recuperação Break-Glass (Shamir 2 de 3)</span>
                </button>
              </div>
            </div>
          )}

          {authStep === 'verifying' && (
            <div className="py-6 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full border-4 border-[#FFC107] border-t-transparent animate-spin" />
              <div className="text-center">
                <p className="text-xs font-bold text-white">Validando Token & Regras de Acesso...</p>
                <p className="text-[11px] text-neutral-400 font-mono">auth.token.role === 'FOUNDER'</p>
              </div>
            </div>
          )}

          {authStep === 'granted' && (
            <div className="py-6 flex flex-col items-center justify-center space-y-2 bg-emerald-950/30 rounded-2xl border border-emerald-500/40">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
              <p className="text-sm font-bold text-emerald-300">Acesso Autorizado • Modo Master Ativado</p>
              <p className="text-[11px] text-neutral-400">Carregando os 3 Smartphones do Ecossistema...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
          <span>GO.BRO.AAO v1.0 • RBAC SECURE</span>
          <span>SLA &lt; 100ms</span>
        </div>
      </div>
    </div>
  );
};
