import React, { useEffect, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const;

export function useReducedMotionPref() {
  return useReducedMotion();
}

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  blur?: boolean;
  once?: boolean;
  className?: string;
  duration?: number;
  amount?: number;
};

export function RevealOnScroll({
  children,
  delay = 0,
  y = 28,
  blur = true,
  once = true,
  className = '',
  duration = 0.85,
  amount = 0.18,
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once, amount });

  const initial = reduce
    ? { opacity: 1, y: 0, filter: 'blur(0px)' }
    : { opacity: 0, y, filter: blur ? 'blur(8px)' : 'blur(0px)' };
  const animate = inView
    ? { opacity: 1, y: 0, filter: 'blur(0px)' }
    : initial;

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={animate}
      transition={{ duration: reduce ? 0 : duration, delay: reduce ? 0 : delay, ease: EASE_OUT_EXPO }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGroup({
  children,
  delayChildren = 0,
  staggerChildren = 0.08,
  className = '',
  amount = 0.18,
}: {
  children: React.ReactNode;
  delayChildren?: number;
  staggerChildren?: number;
  className?: string;
  amount?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: reduce ? 0 : delayChildren,
            staggerChildren: reduce ? 0 : staggerChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE_OUT_EXPO } },
};

export function AmbientGlow({
  className = '',
  colors = ['rgba(124,92,252,0.18)', 'rgba(79,158,255,0.16)'],
}: {
  className?: string;
  colors?: [string, string] | string[];
}) {
  const reduce = useReducedMotion();
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <motion.div
        className="absolute -left-[20%] top-[10%] h-[55%] w-[55%] rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors[0]} 0%, transparent 60%)`,
          filter: 'blur(60px)',
        }}
        animate={reduce ? undefined : { x: [0, 40, -20, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 22, ease: 'easeInOut', repeat: Infinity }}
      />
      <motion.div
        className="absolute -right-[15%] bottom-[5%] h-[60%] w-[60%] rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors[1]} 0%, transparent 60%)`,
          filter: 'blur(70px)',
        }}
        animate={reduce ? undefined : { x: [0, -30, 20, 0], y: [0, 30, -15, 0] }}
        transition={{ duration: 26, ease: 'easeInOut', repeat: Infinity }}
      />
    </div>
  );
}

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const onChange = () => setIsMobile(window.innerWidth < breakpoint);
    onChange();
    window.addEventListener('resize', onChange);
    return () => window.removeEventListener('resize', onChange);
  }, [breakpoint]);
  return isMobile;
}
