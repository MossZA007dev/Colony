import React, { useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type TextRevealProps = {
  text: string;
  className?: string;
  /** Per-word stagger in seconds. Default 0.025. */
  stagger?: number;
  /** Initial delay before reveal starts. */
  delay?: number;
  /** Per-word duration. Default 0.55. */
  duration?: number;
};

/**
 * Word-by-word reveal used for AI Ant generated answers.
 * - Preserves line breaks (whitespace: pre-line on parent still applies).
 * - Animates only on first mount per message id (no replay on parent re-render).
 * - Honors prefers-reduced-motion.
 */
export function TextReveal({ text, className = '', stagger = 0.025, delay = 0, duration = 0.55 }: TextRevealProps) {
  const reduce = useReducedMotion();
  // Track whether this instance has already played, so streaming updates / parent
  // re-renders don't restart the animation.
  const playedRef = useRef(false);

  // Split into segments that keep whitespace + newlines intact so layout matches
  // the plain-text version exactly.
  const segments = useMemo(() => text.split(/(\s+)/), [text]);

  if (reduce || playedRef.current) {
    playedRef.current = true;
    return <span className={className}>{text}</span>;
  }

  // After first mount, freeze further re-animation.
  // (React runs the render → effects, so we set the flag after render.)
  queueMicrotask(() => { playedRef.current = true; });

  let wordIndex = 0;
  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (/^\s+$/.test(seg)) {
          // Preserve whitespace verbatim (including newlines for whitespace-pre-line).
          return <React.Fragment key={`s-${i}`}>{seg}</React.Fragment>;
        }
        const wi = wordIndex++;
        return (
          <motion.span
            key={`w-${i}`}
            initial={{ opacity: 0, y: 6, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              duration,
              delay: delay + wi * stagger,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ display: 'inline-block', willChange: 'opacity, transform, filter' }}
          >
            {seg}
          </motion.span>
        );
      })}
    </span>
  );
}

export default TextReveal;
