import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, type HTMLMotionProps } from 'framer-motion';

function cn(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(' ');
}

type PopoverSide = 'top' | 'right' | 'bottom' | 'left';
type PopoverAlign = 'start' | 'center' | 'end';

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
};

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) throw new Error('Popover subcomponents must be used inside <Popover>.');
  return ctx;
}

export type PopoverProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

function Popover({ open, defaultOpen, onOpenChange, children }: PopoverProps) {
  const [internal, setInternal] = React.useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const current = isControlled ? (open as boolean) : internal;
  const triggerRef = React.useRef<HTMLElement | null>(null);

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternal(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <PopoverContext.Provider value={{ open: current, setOpen, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  );
}

export type PopoverTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

function PopoverTrigger({ asChild, onClick, children, ...rest }: PopoverTriggerProps) {
  const { open, setOpen, triggerRef } = usePopoverContext();

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    setOpen(!open);
    onClick?.(e as React.MouseEvent<HTMLButtonElement>);
  };

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ onClick?: (e: React.MouseEvent<HTMLElement>) => void }>;
    return React.cloneElement(child, {
      ref: (node: HTMLElement | null) => {
        triggerRef.current = node;
      },
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        child.props.onClick?.(e);
        handleClick(e);
      },
      'aria-expanded': open,
      'aria-haspopup': 'dialog',
      'data-state': open ? 'open' : 'closed',
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <button
      ref={(node) => { triggerRef.current = node; }}
      type="button"
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup="dialog"
      data-state={open ? 'open' : 'closed'}
      {...rest}
    >
      {children}
    </button>
  );
}

export type PopoverContentProps = Omit<HTMLMotionProps<'div'>, 'ref'> & {
  align?: PopoverAlign;
  side?: PopoverSide;
  sideOffset?: number;
};

function PopoverContent({
  className,
  align = 'center',
  side = 'bottom',
  sideOffset = 4,
  children,
  ...rest
}: PopoverContentProps) {
  const { open, setOpen, triggerRef } = usePopoverContext();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number; origin: string } | null>(null);

  // Position the content next to the trigger. Measured after layout so we
  // know the content's own size before placing it.
  React.useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    const trigger = triggerRef.current;
    const content = contentRef.current;
    if (!trigger || !content) return;

    const compute = () => {
      const tr = trigger.getBoundingClientRect();
      const cr = content.getBoundingClientRect();
      let top = 0;
      let left = 0;

      if (side === 'bottom') top = tr.bottom + sideOffset;
      else if (side === 'top') top = tr.top - cr.height - sideOffset;
      else if (side === 'right') { left = tr.right + sideOffset; top = tr.top; }
      else { left = tr.left - cr.width - sideOffset; top = tr.top; }

      if (side === 'top' || side === 'bottom') {
        if (align === 'start') left = tr.left;
        else if (align === 'end') left = tr.right - cr.width;
        else left = tr.left + tr.width / 2 - cr.width / 2;
      } else {
        if (align === 'start') top = tr.top;
        else if (align === 'end') top = tr.bottom - cr.height;
        else top = tr.top + tr.height / 2 - cr.height / 2;
      }

      // Clamp to viewport so it never floats off-screen.
      const pad = 8;
      const maxLeft = window.innerWidth - cr.width - pad;
      const maxTop = window.innerHeight - cr.height - pad;
      left = Math.max(pad, Math.min(left, maxLeft));
      top = Math.max(pad, Math.min(top, maxTop));

      const origin =
        side === 'bottom' ? 'top center' :
        side === 'top'    ? 'bottom center' :
        side === 'right'  ? 'left center' : 'right center';

      setPos({ top: top + window.scrollY, left: left + window.scrollX, origin });
    };

    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [open, side, align, sideOffset, triggerRef]);

  // Click-outside + Escape to close.
  React.useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const t = triggerRef.current;
      const c = contentRef.current;
      if (!t || !c) return;
      const tgt = e.target as Node;
      if (t.contains(tgt) || c.contains(tgt)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setOpen, triggerRef]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={contentRef}
          role="dialog"
          data-state={open ? 'open' : 'closed'}
          data-side={side}
          data-align={align}
          initial={{
            opacity: 0,
            scale: 0.96,
            y: side === 'bottom' ? -4 : side === 'top' ? 4 : 0,
            x: side === 'right' ? -4 : side === 'left' ? 4 : 0,
          }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            top: pos?.top ?? -9999,
            left: pos?.left ?? -9999,
            transformOrigin: pos?.origin ?? 'top center',
            visibility: pos ? 'visible' : 'hidden',
          }}
          className={cn(
            'z-50 w-72 rounded-md border border-white/[0.10] bg-[#0e1220] p-4 text-[13px] text-white/85 shadow-[0_24px_70px_rgba(0,0,0,0.55)] outline-none',
            className,
          )}
          {...rest}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export type PopoverCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

function PopoverClose({ onClick, children, ...rest }: PopoverCloseProps) {
  const { setOpen } = usePopoverContext();
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export { Popover, PopoverTrigger, PopoverContent, PopoverClose };
