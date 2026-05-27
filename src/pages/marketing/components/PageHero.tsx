import React from 'react';
import { motion } from 'framer-motion';
import { EASE_OUT_EXPO } from '../../LandingPage/components/motion';

export function PageHero({
  eyebrow,
  title,
  subtitle,
  ctas,
  accent = 'blue',
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  ctas?: React.ReactNode;
  accent?: 'blue' | 'violet' | 'amber' | 'teal';
}) {
  const accentDot: Record<string, string> = {
    blue: 'bg-[#7db7ff] shadow-[0_0_14px_rgba(125,183,255,0.6)]',
    violet: 'bg-[#a78bfa] shadow-[0_0_14px_rgba(167,139,250,0.6)]',
    amber: 'bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.6)]',
    teal: 'bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.6)]',
  };

  return (
    <section className="relative overflow-hidden px-5 pb-14 pt-20 md:px-8 md:pb-20 md:pt-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 mx-auto h-[360px] max-w-[1100px]"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 30%, rgba(124,92,252,0.16), transparent 70%), radial-gradient(55% 55% at 50% 85%, rgba(125,183,255,0.12), transparent 75%)',
          filter: 'blur(28px)',
        }}
      />
      <div className="relative mx-auto max-w-[980px] text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/65"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${accentDot[accent]}`} />
          {eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.06, ease: EASE_OUT_EXPO }}
          className="text-[clamp(34px,5vw,56px)] font-semibold leading-[1.06] tracking-[-0.025em] text-white"
        >
          {title}
        </motion.h1>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18, ease: EASE_OUT_EXPO }}
            className="mx-auto mt-5 max-w-[640px] text-[16px] leading-relaxed text-white/65 md:text-[17px]"
          >
            {subtitle}
          </motion.p>
        )}
        {ctas && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE_OUT_EXPO }}
            className="mt-7 flex flex-wrap items-center justify-center gap-3"
          >
            {ctas}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default PageHero;
