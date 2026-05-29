import React, { useEffect, useRef } from 'react';
import type { ContextMenuDef } from '../../lib/types/appTypes';

export function ContextMenu({ x, y, items, onClose, dark = false }: {
  x: number;
  y: number;
  items: ContextMenuDef[];
  onClose: () => void;
  dark?: boolean;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClick, true);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick, true);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 34 - 24);

  return (
    <div
      ref={menuRef}
      className={`fixed z-[9999] min-w-[180px] overflow-hidden rounded-xl py-1.5 shadow-[0_16px_48px_rgba(0,0,0,0.55)] ${
        dark
          ? 'border border-white/[0.08] bg-[#13131e]'
          : 'border border-white-07 bg-surface shadow-[0_12px_36px_rgba(0,0,0,0.18)]'
      }`}
      style={{ left: adjustedX, top: adjustedY }}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={i} className={`my-1 h-px ${dark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />
        ) : (
          <button
            key={i}
            onClick={() => { item.onClick(); onClose(); }}
            className={`flex w-full items-center gap-2.5 px-3.5 py-[7px] text-left text-[12px] font-medium transition-colors ${
              dark
                ? `hover:bg-white/[0.06] ${item.danger ? 'text-red-400 hover:text-red-300' : 'text-white/70 hover:text-white'}`
                : `hover:bg-surface2 ${item.danger ? 'text-red-500 hover:text-red-600' : 'text-muted hover:text-ink'}`
            }`}
          >
            {item.icon && <span className="w-4 text-center text-[13px]">{item.icon}</span>}
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

