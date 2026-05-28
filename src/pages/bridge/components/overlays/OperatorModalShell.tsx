import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export function OperatorModalShell({
  open,
  onClose,
  eyebrow,
  title,
  description,
  children,
  footer,
  width = 'md',
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  width?: 'sm' | 'md' | 'lg';
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const widthClass = width === 'sm' ? 'max-w-md' : width === 'lg' ? 'max-w-2xl' : 'max-w-lg';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[140] grid place-items-center bg-black/70 p-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: 6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full ${widthClass} overflow-hidden rounded-[16px] border border-white/[0.08] bg-[#0b1020]/97 text-white shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl`}
          >
            <div className="flex items-start justify-between gap-3 px-6 pt-5">
              <div className="min-w-0 flex-1">
                {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
                <h2 className="font-heading text-[17px] font-extrabold leading-tight text-white/95">{title}</h2>
                {description && <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-400/40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5">
              {children}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.06] bg-white/[0.015] px-6 py-4">
              {footer}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function OperatorModalRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/35">{label}</span>
      <span className="min-w-0 text-right text-[13px] text-white/80">{value}</span>
    </div>
  );
}

export function OperatorModalChecklist({ items, tone = 'neutral' }: { items: string[]; tone?: 'allow' | 'deny' | 'neutral' }) {
  const dot = tone === 'allow' ? 'bg-emerald-300' : tone === 'deny' ? 'bg-red-300' : 'bg-white/40';
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`} className="flex items-start gap-2 text-[12.5px] text-white/72">
          <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
          <span className="min-w-0 flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function OperatorModalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 first:mt-0">
      <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/35">{title}</p>
      {children}
    </section>
  );
}

export function PrimaryButton({ children, onClick, tone = 'violet', disabled }: { children: React.ReactNode; onClick?: () => void; tone?: 'violet' | 'emerald' | 'amber'; disabled?: boolean }) {
  const cls = tone === 'emerald'
    ? 'bg-emerald-500/95 hover:bg-emerald-500 text-white'
    : tone === 'amber'
      ? 'bg-amber-500/95 hover:bg-amber-500 text-[#1a1100]'
      : 'bg-violet-600 hover:bg-violet-500 text-white';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[10px] px-4 py-2 text-[12.5px] font-semibold transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 disabled:opacity-50 motion-reduce:transition-none ${cls}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, tone = 'neutral' }: { children: React.ReactNode; onClick?: () => void; tone?: 'neutral' | 'danger' }) {
  const cls = tone === 'danger'
    ? 'border-red-400/30 text-red-200 hover:bg-red-400/[0.08]'
    : 'border-white/[0.14] text-white/65 hover:bg-white/[0.05] hover:text-white/90';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[10px] border px-4 py-2 text-[12.5px] font-semibold transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 motion-reduce:transition-none ${cls}`}
    >
      {children}
    </button>
  );
}
