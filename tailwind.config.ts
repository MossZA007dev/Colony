import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        surface2: 'rgb(var(--color-surface2) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        subtle: 'rgb(var(--color-subtle) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dmsans: ['"DM Sans"', 'sans-serif'],
        inter: ['Inter', '"DM Sans"', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        // Brand typography tokens — single source for heading/body voice.
        heading: ['Inter', '"DM Sans"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      fontSize: {
        'heading-xl': ['clamp(2.2rem, 4vw, 3.4rem)', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '800' }],
        'heading-lg': ['clamp(1.6rem, 2.6vw, 2.2rem)', { lineHeight: '1.1', letterSpacing: '-0.015em', fontWeight: '800' }],
        section: ['1.125rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }],
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(79,158,255,0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(79,158,255,0.4)' },
        },
        appear: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        glow: 'glow 2s ease-in-out infinite',
        appear: 'appear 0.4s ease-out forwards',
      }
    },
  },
  plugins: [],
} satisfies Config;
