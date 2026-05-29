import React, { useState } from 'react';

export function AppModal({
  type, title, message, confirmLabel, initialValue, placeholder, helperText,
  onConfirm, onSave, onCancel,
}: {
  type: 'confirm' | 'text-edit' | 'rename';
  title: string;
  message?: string;
  confirmLabel?: string;
  initialValue?: string;
  placeholder?: string;
  helperText?: string;
  onConfirm?: () => void;
  onSave?: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue ?? '');

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/65 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-[#13131e] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.8)]">
        <h3 className="mb-2 font-heading text-[16px] font-bold text-white">{title}</h3>

        {type === 'confirm' && (
          <>
            <p className="mb-6 text-[13px] leading-relaxed text-white/75">{message}</p>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 rounded-xl border border-white/[0.18] py-2.5 text-[13px] font-semibold text-white/80 transition hover:bg-white/[0.07]">
                Cancel
              </button>
              <button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500/80 py-2.5 text-[13px] font-semibold text-white transition hover:bg-red-500">
                {confirmLabel ?? 'Delete'}
              </button>
            </div>
          </>
        )}

        {type === 'text-edit' && (
          <>
            <textarea
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder ?? 'Enter instructions…'}
              rows={5}
              className="mb-2 w-full resize-none rounded-xl border border-white/[0.12] bg-white/[0.05] px-3.5 py-2.5 text-[13px] leading-relaxed text-white outline-none placeholder:text-white/35 focus:border-white/25"
            />
            {helperText && <p className="mb-5 text-[11px] leading-relaxed text-white/55">{helperText}</p>}
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 rounded-xl border border-white/[0.18] py-2.5 text-[13px] font-semibold text-white/80 transition hover:bg-white/[0.07]">
                Cancel
              </button>
              <button onClick={() => onSave?.(value.trim())} className="flex-1 rounded-xl bg-accent py-2.5 text-[13px] font-semibold text-white transition hover:bg-accent/85">
                Save
              </button>
            </div>
          </>
        )}

        {type === 'rename' && (
          <>
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && value.trim()) onSave?.(value.trim());
                if (e.key === 'Escape') onCancel();
              }}
              placeholder="Enter new name…"
              className="mb-5 w-full rounded-xl border border-white/[0.12] bg-white/[0.05] px-3.5 py-2.5 text-[13px] text-white outline-none placeholder:text-white/35 focus:border-white/25"
            />
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 rounded-xl border border-white/[0.18] py-2.5 text-[13px] font-semibold text-white/80 transition hover:bg-white/[0.07]">
                Cancel
              </button>
              <button
                onClick={() => value.trim() && onSave?.(value.trim())}
                className="flex-1 rounded-xl bg-accent py-2.5 text-[13px] font-semibold text-white transition hover:bg-accent/85"
              >
                Rename
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

