import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { EASE_OUT_EXPO } from './motion';

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function formatCount(value: number) {
  return Math.round(value).toLocaleString('en-US');
}

function AnimatedCount({ value }: { value: number | null }) {
  const reduce = useReducedMotion();
  const numericValue = value ?? 0;
  const [displayValue, setDisplayValue] = React.useState(numericValue);
  const previousValue = React.useRef(numericValue);

  React.useEffect(() => {
    if (value === null) return;

    if (reduce) {
      setDisplayValue(numericValue);
      previousValue.current = numericValue;
      return;
    }

    const start = previousValue.current;
    const distance = numericValue - start;
    const duration = 800;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      setDisplayValue(start + distance * easeOutCubic(progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        previousValue.current = numericValue;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [numericValue, reduce, value]);

  return <>{value === null ? '-' : formatCount(displayValue)}</>;
}

export function LiveWaitlistCounter({ count }: { count: number | null }) {
  const label = count === 1 ? 'person on the waitlist' : 'people on the waitlist';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.75, delay: 0.72, ease: EASE_OUT_EXPO }}
      className="mx-auto mt-6 w-full max-w-[320px] text-left lg:mx-0"
    >
      <div className="mb-1.5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#7db7ff]/45 opacity-75 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#9ecbff]" />
        </span>
        LIVE WAITLIST
      </div>
      <div className="bg-gradient-to-br from-white via-[#dbeaff] to-[#9fbbff] bg-clip-text text-[clamp(42px,6vw,64px)] font-semibold leading-none tracking-[-0.055em] text-transparent drop-shadow-[0_0_18px_rgba(125,183,255,0.22)]">
        <AnimatedCount value={count} />
      </div>
      <p className="mt-1 text-[13px] font-medium text-white/50">{label}</p>
    </motion.div>
  );
}
