import React from 'react';
import {
  KeyRound,
  ShieldCheck,
  Server,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  RefreshCw
} from 'lucide-react';
import { BOOTSTRAP_VAULT_INFO } from '../../data/unifiedShellData';

export const BootstrapVaultViewer: React.FC = () => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#005A2B] text-[#FFC107] border border-emerald-500/30">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Bootstrap Vault & Injeção Dinâmica de Segredos
            </h3>
            <p className="text-xs text-neutral-400">
              Conformidade V2.0: <strong>Zero Hardcoded Credentials</strong> na Constituição ou Repositório
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-600 px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Vault Sealed & Injected</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-1">
          <div className="text-neutral-500 text-[10px] uppercase">Provedor de Segredos:</div>
          <div className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
            <Server className="w-4 h-4 text-[#FFC107]" />
            <span>{BOOTSTRAP_VAULT_INFO.provider}</span>
          </div>
          <p className="text-[10px] text-neutral-400 pt-1 font-sans">
            Injeção via IAM Service Account no Cloud Run sem segredos em texto plano.
          </p>
        </div>

        <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-1">
          <div className="text-neutral-500 text-[10px] uppercase">Ambiente Ativo:</div>
          <div className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="uppercase">{BOOTSTRAP_VAULT_INFO.environment}</span>
          </div>
          <p className="text-[10px] text-neutral-400 pt-1 font-sans">
            Chaves KMS rotativas com expiração automática a cada 90 dias.
          </p>
        </div>

        <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-1">
          <div className="text-neutral-500 text-[10px] uppercase">Auditoria de Repositório:</div>
          <div className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>100% Livre de Segredos</span>
          </div>
          <p className="text-[10px] text-neutral-400 pt-1 font-sans">
            Nenhum e-mail de fundador, PIN, senha ou UUID fixo no código fonte.
          </p>
        </div>
      </div>

      {/* Comparison Box */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <div className="text-xs font-bold text-neutral-300 flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-[#FFC107]" />
          <span>Contrato Arquitetural de Segurança (V1 vs V2)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/60 space-y-1">
            <div className="text-red-400 font-bold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Padrão Proibido (V1 Inseguro)</span>
            </div>
            <p className="text-neutral-400 text-[11px] font-mono">
              // ❌ HARDCODED NO CÓDIGO:<br />
              const FOUNDER_PIN = "1234";<br />
              const FOUNDER_EMAIL = "admin@...";
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 space-y-1">
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Padrão Constitucional Homologado (V2 Vault)</span>
            </div>
            <p className="text-neutral-300 text-[11px] font-mono">
              // ✅ INJETADO VIA ENVIRONMENT / VAULT:<br />
              final vaultKey = SecretManager.get('FOUNDER_CHALLENGE_PUBLIC_KEY');
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
