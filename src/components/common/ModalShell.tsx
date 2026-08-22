import React from 'react';
import { X } from 'lucide-react';

interface ModalShellProps {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  overlayClassName?: string;
  panelClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  closeButtonClassName?: string;
  maxWidthClassName?: string;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  icon,
  title,
  subtitle,
  badge,
  header,
  children,
  footer,
  onClose,
  overlayClassName = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4',
  panelClassName = 'bg-neutral-900 border border-neutral-800 rounded-3xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200',
  headerClassName = 'bg-neutral-950 px-5 py-4 border-b border-neutral-800 flex items-center justify-between',
  contentClassName = 'p-5',
  closeButtonClassName = 'p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors',
  maxWidthClassName = 'max-w-sm'
}) => (
  <div className={overlayClassName}>
    <div className={`${panelClassName} ${maxWidthClassName}`}>
      {header || (
        <div className={headerClassName}>
          <div className="flex items-center gap-2.5">
            {icon}
            <div>
              <div className="flex items-center gap-2">
                {title && <h3 className="text-sm font-bold text-white">{title}</h3>}
                {badge}
              </div>
              {subtitle && <p className="text-[11px] text-neutral-400">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className={closeButtonClassName}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className={contentClassName}>{children}</div>
      {footer}
    </div>
  </div>
);
