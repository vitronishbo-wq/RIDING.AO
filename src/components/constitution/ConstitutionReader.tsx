import React, { useState } from 'react';
import { CONSTITUTION_CHAPTERS, FORBIDDEN_TECH_LIST, OPERATIONAL_SLAS } from '../../data/constitutionData';
import {
  BookOpen,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  Copy,
  Check,
  Lock,
  Cpu,
  Layers,
  Scale
} from 'lucide-react';

export const ConstitutionReader: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState<number>(1);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filteredChapters = CONSTITUTION_CHAPTERS.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.rules.some((r) => r.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedChapter = CONSTITUTION_CHAPTERS.find((c) => c.id === selectedChapterId) || CONSTITUTION_CHAPTERS[0];

  const handleCopyChapter = (chapterId: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(chapterId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#005A2B]/40 via-neutral-900 to-neutral-900 border border-[#005A2B]/60 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#005A2B] text-[#FFC107] border border-[#FFC107]/30">
                <Lock className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                GO.BRO.AAO — Arquitetura Constitucional (Versão 1.0)
              </h2>
              <span className="bg-[#FFC107] text-[#1A1A1A] font-black text-xs px-2.5 py-0.5 rounded-full font-mono">
                STATUS: FROZEN
              </span>
            </div>
            <p className="text-xs text-neutral-300 max-w-3xl pt-1">
              Documento normativo definitivo vigente a partir de 20 de Agosto de 2026. Serve como única fonte de verdade para qualquer IA ou engenheiro no projeto.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/50 border border-neutral-700 px-3.5 py-2 rounded-2xl text-xs text-neutral-300">
              <span className="text-neutral-400">Total de Capítulos:</span> <strong className="text-[#FFC107]">14</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Constitution Explorer (Split: Sidebar Chapters + Chapter Detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Chapter List & Search */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar regras, tecnologias ou SLAs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#005A2B]"
            />
          </div>

          {/* Chapter Buttons List */}
          <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredChapters.map((chapter) => {
              const isSelected = selectedChapter.id === chapter.id;
              return (
                <button
                  key={chapter.id}
                  onClick={() => setSelectedChapterId(chapter.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-[#005A2B] border-emerald-500 text-white shadow-md'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-[#FFC107]' : 'text-neutral-500'}`}>
                      CAPÍTULO {chapter.id}
                    </span>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-black/40 text-neutral-300">
                      {chapter.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs mt-0.5">{chapter.title.split('—')[1]?.trim() || chapter.title}</h4>
                  <p className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-neutral-400'}`}>
                    {chapter.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Chapter Detail Card */}
        <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
          {/* Chapter Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{selectedChapter.title}</h3>
                <span className="text-xs font-mono bg-[#005A2B]/40 text-emerald-300 border border-[#005A2B] px-2 py-0.5 rounded-md">
                  {selectedChapter.subtitle}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">{selectedChapter.summary}</p>
            </div>

            <button
              onClick={() =>
                handleCopyChapter(
                  selectedChapter.id,
                  `${selectedChapter.title}\n${selectedChapter.rules.join('\n')}`
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 border border-neutral-700 transition-all"
            >
              {copiedId === selectedChapter.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Capítulo</span>
                </>
              )}
            </button>
          </div>

          {/* Rules List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#FFC107]" />
              <span>Regras Normativas Obrigatórias</span>
            </h4>

            <div className="space-y-2">
              {selectedChapter.rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="bg-neutral-950/70 border border-neutral-800/90 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-neutral-200"
                >
                  <span className="w-5 h-5 rounded-full bg-[#005A2B]/30 text-emerald-300 border border-[#005A2B] flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Code Contract Snippet if any */}
          {selectedChapter.codeSnippet && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>Contrato de Código (Dart / Python)</span>
              </h4>
              <div className="bg-black/90 border border-neutral-800 rounded-2xl p-4 overflow-x-auto font-mono text-[11px] text-emerald-400">
                <pre>{selectedChapter.codeSnippet}</pre>
              </div>
            </div>
          )}

          {/* Special Context for Chapter 3 (Forbidden Tech) */}
          {selectedChapter.id === 3 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                <span>Tabela de Anti-padrões e Rejeição Automática em PR</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-neutral-800 rounded-xl overflow-hidden">
                  <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 text-[11px]">
                    <tr>
                      <th className="p-2.5">Categoria</th>
                      <th className="p-2.5 text-red-400">Tecnologia Proibida</th>
                      <th className="p-2.5 text-emerald-400">Substituto Obrigatório</th>
                      <th className="p-2.5">Motivo Técnico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-neutral-300">
                    {FORBIDDEN_TECH_LIST.map((item, i) => (
                      <tr key={i} className="hover:bg-neutral-800/40">
                        <td className="p-2.5 font-semibold text-white">{item.category}</td>
                        <td className="p-2.5 font-mono text-red-400">{item.forbidden.join(', ')}</td>
                        <td className="p-2.5 font-semibold text-emerald-400">{item.allowedAlternative}</td>
                        <td className="p-2.5 text-neutral-400 text-[11px]">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Special Context for Chapter 5 (SLAs) */}
          {selectedChapter.id === 5 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Scale className="w-4 h-4" />
                <span>Auditoria de Limites Operacionais em Tempo Real</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OPERATIONAL_SLAS.map((sla, i) => (
                  <div key={i} className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{sla.metric}</span>
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded text-[10px]">
                        Atual: {sla.currentSimulated}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-neutral-400">
                      <span>Limite Constitucional:</span>
                      <span className="font-mono font-bold text-amber-400">{sla.limit}</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 pt-1">{sla.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
