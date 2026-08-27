import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  compact?: boolean;
  className?: string;
  itemName?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  compact = false,
  className = '',
  itemName = 'itens'
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, safeCurrentPage * pageSize);

  const handlePrev = () => {
    if (safeCurrentPage > 1) {
      onPageChange(safeCurrentPage - 1);
    }
  };

  const handleNext = () => {
    if (safeCurrentPage < totalPages) {
      onPageChange(safeCurrentPage + 1);
    }
  };

  const handleFirst = () => onPageChange(1);
  const handleLast = () => onPageChange(totalPages);

  if (totalItems <= pageSize && !onPageSizeChange && totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 text-xs font-mono select-none ${
        compact ? 'py-2 px-1' : 'bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-2.5'
      } ${className}`}
    >
      {/* Item range counter & total info */}
      <div className="flex items-center gap-2 text-neutral-400 text-[11px]">
        <span>
          Mostrando <strong className="text-white font-bold">{startItem}</strong>-
          <strong className="text-white font-bold">{endItem}</strong> de{' '}
          <strong className="text-emerald-400 font-bold">{totalItems}</strong> {itemName}
        </span>

        {/* Optional Page Size Selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-neutral-800">
            <span className="text-neutral-500 text-[10px]">Por pág:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="bg-neutral-900 border border-neutral-700 text-neutral-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none focus:border-emerald-500"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        {totalPages > 3 && (
          <button
            onClick={handleFirst}
            disabled={safeCurrentPage === 1}
            title="Primeira Página"
            className="p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={handlePrev}
          disabled={safeCurrentPage === 1}
          title="Página Anterior"
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors text-[11px]"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <span className="px-2.5 py-1 text-[11px] font-bold text-emerald-400 bg-neutral-900/90 rounded-lg border border-neutral-800">
          {safeCurrentPage} / {totalPages}
        </span>

        <button
          onClick={handleNext}
          disabled={safeCurrentPage === totalPages}
          title="Próxima Página"
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors text-[11px]"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {totalPages > 3 && (
          <button
            onClick={handleLast}
            disabled={safeCurrentPage === totalPages}
            title="Última Página"
            className="p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
