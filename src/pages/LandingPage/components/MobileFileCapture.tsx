import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ShieldCheck, FileText, Image as ImageIcon, FolderArchive, Bot, Smartphone } from 'lucide-react';
import { RevealOnScroll, EASE_OUT_EXPO } from './motion';
import { AntMark } from '../../../components/brand/BrandMarks';

type Notification = { title: string; sub: string };

const NOTIFICATIONS: Notification[] = [
  { title: 'Approved report file selected on mobile', sub: 'Prepared for analysis preview' },
  { title: 'Approved sales screenshot selected on mobile', sub: 'Prepared for summary preview' },
  { title: 'Approved receipt photo selected on mobile', sub: 'Prepared for extraction preview' },
  { title: 'Approved product image selected on mobile', sub: 'Prepared for review preview' },
];

const ROTATE_MS = 4200;

export function MobileFileCapture() {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % NOTIFICATIONS.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [reduce]);

  const current = NOTIFICATIONS[idx];

  return (
    <section id="mobile-bridge" className="relative px-5 py-28 md:px-8 md:py-36">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-16">
          <RevealOnScroll>
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">
              <Smartphone className="h-3.5 w-3.5" />
              In Development
            </p>
            <h2 className="max-w-xl text-[34px] font-semibold leading-[1.08] tracking-tight text-white md:text-[48px]">
              Approved mobile file access, designed for future workflows.
            </h2>
            <p className="mt-5 max-w-[520px] text-[15px] leading-[1.65] text-white/62 md:text-[16px]">
              We are exploring a way for AI Ant to retrieve user-approved screenshots or files from a mobile device and prepare them for analysis or reporting.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#34d399]/22 bg-[#34d399]/[0.06] px-3 py-1.5 text-[12px] font-medium text-[#a7f3d0]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                Prototype concept
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.035] px-3 py-1.5 text-[12px] text-white/65">
                <ShieldCheck className="h-3.5 w-3.5 text-white/55" />
                User-approved files
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.035] px-3 py-1.5 text-[12px] text-white/65">
                <Bot className="h-3.5 w-3.5 text-white/55" />
                Future AI Ant hand-off
              </span>
            </div>
          </RevealOnScroll>

          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
              <div
                className="absolute left-1/2 top-1/4 h-[65%] w-[85%] -translate-x-1/2 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(52,211,153,0.16) 0%, rgba(124,92,252,0.10) 45%, transparent 70%)',
                  filter: 'blur(60px)',
                }}
              />
            </div>
            <PhoneMockup current={current} idx={idx} reduce={Boolean(reduce)} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup({ current, idx, reduce }: { current: Notification; idx: number; reduce: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[320px]">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.95, ease: EASE_OUT_EXPO }}
        className="relative aspect-[9/19] rounded-[44px] border border-white/[0.12] bg-gradient-to-b from-[#0c1018] to-[#06080d] p-3 shadow-[0_60px_160px_rgba(0,0,0,0.55)]"
      >
        {/* Dynamic island */}
        <div className="absolute left-1/2 top-2.5 z-20 h-[22px] w-[96px] -translate-x-1/2 rounded-full bg-[#03050a]" />

        <div className="relative h-full w-full overflow-hidden rounded-[34px] border border-white/[0.05] bg-[#04060b]">
          {/* Status bar */}
          <div className="flex h-9 items-center justify-between px-5 pt-3 text-[10px] font-semibold text-white/55">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2.5 rounded-[2px] bg-white/55" />
              <span className="h-2 w-2.5 rounded-[2px] bg-white/55" />
              <span className="h-2 w-3.5 rounded-[2px] bg-white/65" />
            </span>
          </div>

          {/* Approved access pulse */}
          <div className="mt-3 flex justify-center">
            <motion.span
              initial={reduce ? false : { opacity: 0, y: -4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, delay: 0.35, ease: EASE_OUT_EXPO }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#34d399]/28 bg-[#34d399]/[0.08] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#a7f3d0]"
            >
              <span className="relative flex h-1.5 w-1.5">
                {!reduce && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#34d399]/60" />
                )}
                <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-[#34d399]" />
              </span>
              Approved
            </motion.span>
          </div>

          {/* Notification card */}
          <div className="mt-4 px-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={reduce ? false : { opacity: 0, y: -18, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={reduce ? undefined : { opacity: 0, y: 10, filter: 'blur(4px)' }}
                transition={{ duration: 0.75, ease: EASE_OUT_EXPO }}
                className="rounded-2xl border border-white/[0.10] bg-white/[0.05] p-3 shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-md"
              >
                <div className="flex items-start gap-2.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-white/[0.06] ring-1 ring-white/[0.10]">
                    <AntMark size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/75">Colony</span>
                      <span className="text-[10px] font-medium text-white/40">Now</span>
                    </div>
                    <p className="mt-1 text-[12px] leading-snug text-white/88">{current.title}</p>
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-[10.5px] font-medium text-[#a7f3d0]">
                      <span className="h-1 w-1 rounded-full bg-[#34d399]" />
                      {current.sub}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Subtle background app icons */}
          <div className="absolute inset-x-0 bottom-12 grid grid-cols-4 gap-3 px-5 opacity-55">
            {[
              { label: 'Files', icon: FolderArchive },
              { label: 'Gallery', icon: ImageIcon },
              { label: 'Drive', icon: FileText },
              { label: 'AI Ant', icon: Bot },
            ].map((app) => (
              <div key={app.label} className="flex flex-col items-center gap-1.5">
                <div className="grid h-11 w-11 place-items-center rounded-[14px] border border-white/[0.07] bg-white/[0.025]">
                  <app.icon className="h-4 w-4 text-white/60" />
                </div>
                <span className="text-[9px] font-medium text-white/35">{app.label}</span>
              </div>
            ))}
          </div>

          {/* Home indicator */}
          <div className="absolute inset-x-0 bottom-2 flex justify-center">
            <span className="h-1 w-24 rounded-full bg-white/30" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default MobileFileCapture;
