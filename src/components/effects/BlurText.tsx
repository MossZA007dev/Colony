import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

type Snapshot = Record<string, string | number>;

const buildKeyframes = (from: Snapshot, steps: Snapshot[]) => {
  const keys = new Set<string>([...Object.keys(from), ...steps.flatMap((s) => Object.keys(s))]);
  const keyframes: Record<string, Array<string | number>> = {};
  keys.forEach((k) => {
    keyframes[k] = [from[k], ...steps.map((s) => s[k])] as Array<string | number>;
  });
  return keyframes;
};

export type BlurTextProps = {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Snapshot;
  animationTo?: Snapshot[];
  easing?: (t: number) => number;
  onAnimationComplete?: () => void;
  stepDuration?: number;
};

export function BlurText({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing,
  onAnimationComplete,
  stepDuration = 0.35,
}: BlurTextProps) {
  // Preserve newlines from chat content — each line becomes its own flex row so
  // multi-line responses don't collapse into a single wrapped paragraph.
  const safeText = typeof text === 'string' ? text : String(text ?? '');
  const lines = useMemo(() => safeText.split('\n'), [safeText]);

  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const playedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (playedRef.current) { setInView(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          playedRef.current = true;
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultFrom: Snapshot = useMemo(
    () => (direction === 'top'
      ? { filter: 'blur(10px)', opacity: 0, y: -50 }
      : { filter: 'blur(10px)', opacity: 0, y: 50 }),
    [direction],
  );

  const defaultTo: Snapshot[] = useMemo(
    () => [
      { filter: 'blur(5px)', opacity: 0.5, y: direction === 'top' ? 5 : -5 },
      { filter: 'blur(0px)', opacity: 1, y: 0 },
    ],
    [direction],
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;
  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) => (stepCount === 1 ? 0 : i / (stepCount - 1)));

  const totalSegments = lines.reduce(
    (sum, line) => sum + (animateBy === 'words' ? (line.length ? line.split(' ').length : 0) : line.length),
    0,
  );

  let globalIndex = 0;
  const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);

  return (
    <div ref={ref} className={className}>
      {lines.map((line, lineIdx) => {
        if (line.length === 0) {
          // Preserve blank line spacing in the output.
          return <div key={`line-${lineIdx}`} style={{ height: '1em' }} aria-hidden />;
        }
        const segments = animateBy === 'words' ? line.split(' ') : line.split('');
        return (
          <div key={`line-${lineIdx}`} style={{ display: 'flex', flexWrap: 'wrap' }}>
            {segments.map((segment, idx) => {
              const i = globalIndex++;
              const transition = {
                duration: totalDuration,
                times,
                delay: (i * delay) / 1000,
                ...(easing ? { ease: easing } : {}),
              };
              return (
                <motion.span
                  key={`l${lineIdx}-${idx}`}
                  className="inline-block will-change-[transform,filter,opacity]"
                  initial={fromSnapshot}
                  animate={inView ? animateKeyframes : fromSnapshot}
                  transition={transition}
                  onAnimationComplete={i === totalSegments - 1 ? onAnimationComplete : undefined}
                >
                  {segment === ' ' ? ' ' : segment}
                  {animateBy === 'words' && idx < segments.length - 1 && ' '}
                </motion.span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default BlurText;
