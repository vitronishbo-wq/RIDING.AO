import React from 'react';
import { Palette, CheckCircle2, Sparkles, Layers, Box, Type } from 'lucide-react';

export const DesignSystemShowcase: React.FC = () => {
  const colors = [
    { name: 'Primary (Verde Angola)', hex: '#005A2B', text: 'text-white', desc: 'Ações primárias, app bars e status ativo' },
    { name: 'Secondary (Amarelo)', hex: '#FFC107', text: 'text-black', desc: 'Destaques, ratings, moedas (AOA) e alertas' },
    { name: 'Neutral Dark', hex: '#1A1A1A', text: 'text-white', desc: 'Superfícies profundas, app containers' },
    { name: 'Neutral Muted', hex: '#6C757D', text: 'text-white', desc: 'Legendas, bordas sutis e placeholders' },
    { name: 'Neutral Light', hex: '#F8F9FA', text: 'text-black', desc: 'Fundos claros e contrastes de cartão' },
    { name: 'Status Success', hex: '#28A745', text: 'text-white', desc: 'Corridas aceitas, pagamentos confirmados' },
    { name: 'Status Danger', hex: '#DC3545', text: 'text-white', desc: 'Cancelamentos e erros de validação' }
  ];

  const spacings = [4, 8, 16, 24, 32, 48, 64];
  const radiuses = [8, 16, 24];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#005A2B] text-[#FFC107]">
                <Palette className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white">
                Design System & Tokens Oficiais (Capítulo 14)
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Identidade visual estrita para os aplicativos Flutter (Passageiro e Motorista). Nenhum valor de espaçamento fora da escala é permitido.
            </p>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 px-3.5 py-2 rounded-2xl text-xs font-mono text-emerald-400">
            Tipografia: <strong>Inter (400, 500, 600, 700)</strong>
          </div>
        </div>
      </div>

      {/* 1. Official Color Palette */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#FFC107]" />
          <span>Paleta de Cores Constitucional</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {colors.map((c) => (
            <div key={c.hex} className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-md">
              <div
                className="h-20 flex items-end p-3 font-mono font-bold text-xs"
                style={{ backgroundColor: c.hex }}
              >
                <span className={`px-2 py-0.5 rounded backdrop-blur-sm ${c.text} bg-black/20`}>
                  {c.hex}
                </span>
              </div>
              <div className="p-3.5 space-y-1">
                <div className="font-bold text-xs text-white">{c.name}</div>
                <p className="text-[10px] text-neutral-400">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Spacing Scale & Border Radiuses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spacing Tokens */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Box className="w-4 h-4 text-emerald-400" />
            <span>Escala de Espaçamento Homologada</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Apenas valores contidos no conjunto: <strong className="text-white font-mono">{'{ 4, 8, 16, 24, 32, 48, 64 }'} px</strong>.
          </p>

          <div className="space-y-2.5 pt-2">
            {spacings.map((s) => (
              <div key={s} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-mono font-bold text-[#FFC107] text-right">{s} px</span>
                <div
                  className="h-4 bg-[#005A2B] rounded"
                  style={{ width: `${Math.max(s * 3, 12)}px` }}
                />
                <span className="text-[10px] text-neutral-500 font-mono">spacing_{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Border Radius Tokens */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Raios de Borda (BorderRadius)</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Apenas valores contidos no conjunto: <strong className="text-white font-mono">{'{ 8, 16, 24 }'} px</strong>.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {radiuses.map((r) => (
              <div
                key={r}
                className="bg-neutral-950 border border-neutral-800 p-4 text-center space-y-2"
                style={{ borderRadius: `${r}px` }}
              >
                <div className="w-10 h-10 mx-auto bg-[#005A2B] border-2 border-[#FFC107] flex items-center justify-center font-mono font-bold text-white text-xs" style={{ borderRadius: `${r}px` }}>
                  {r}
                </div>
                <div className="font-mono font-bold text-xs text-white">{r} px</div>
                <div className="text-[10px] text-neutral-400">radius_{r}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
