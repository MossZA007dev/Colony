import React from 'react';
import { RevealOnScroll } from './motion';

const PROVIDER_LOGO_DIR = '/assets/Ai%20logo';
const logoFile = (name: string) => `${PROVIDER_LOGO_DIR}/${name.replace(/ /g, '%20')}`;

type LogoItem = { label: string; src: string };

const PROVIDERS: LogoItem[] = [
  { label: 'OpenAI', src: logoFile('OpenAI.svg') },
  { label: 'Claude', src: logoFile('Claude.svg') },
  { label: 'Gemini', src: logoFile('Gemini.svg') },
  { label: 'DeepSeek', src: logoFile('DeepSeek.svg') },
  { label: 'Perplexity', src: logoFile('Perplexity.svg') },
  { label: 'Grok', src: logoFile('Grok.svg') },
  { label: 'Mistral', src: logoFile('Mistral AI.svg') },
  { label: 'Cohere', src: logoFile('Cohere.svg') },
  { label: 'Hugging Face', src: logoFile('Hugging Face.svg') },
  { label: 'Stability', src: logoFile('stability.ai.svg') },
  { label: 'Notion', src: logoFile('Notion.svg') },
  { label: 'Zapier', src: logoFile('Zapier.svg') },
];

export function LogoMarquee() {
  const loop = [...PROVIDERS, ...PROVIDERS];
  return (
    <section id="models" className="px-5 py-24 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <RevealOnScroll>
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-[#7db7ff]">Capabilities</p>
          <h2 className="mx-auto max-w-3xl text-center text-[28px] font-semibold leading-tight tracking-tight text-white md:text-[36px]">
            Designed to work with leading AI models and creative tools.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-[14px] leading-relaxed text-white/55">
            Provider availability is being rolled out gradually. See our roadmap for what&apos;s live today versus planned.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1} className="mt-12">
          <div
            className="logo-marquee relative overflow-hidden"
            style={{
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)',
              maskImage:
                'linear-gradient(to right, transparent 0, black 8%, black 92%, transparent 100%)',
            }}
          >
            <div className="logo-marquee-track flex w-max gap-12 px-4">
              {loop.map((logo, i) => (
                <LogoTile key={`${logo.label}-${i}`} logo={logo} />
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </div>

      <style>{`
        .logo-marquee-track {
          animation: marquee 42s linear infinite;
        }
        .logo-marquee:hover .logo-marquee-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .logo-marquee-track {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}

function LogoTile({ logo }: { logo: LogoItem }) {
  const [errored, setErrored] = React.useState(false);
  return (
    <div className="group flex h-12 shrink-0 items-center gap-3">
      {!errored ? (
        <img
          src={logo.src}
          alt={logo.label}
          onError={() => setErrored(true)}
          className="h-8 w-auto object-contain opacity-50 grayscale transition-all duration-500 group-hover:opacity-100 group-hover:grayscale-0"
          draggable={false}
        />
      ) : (
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-[10px] font-semibold text-white/70">
          {logo.label[0]}
        </span>
      )}
      <span className="text-[13px] font-medium text-white/45 transition-colors duration-500 group-hover:text-white/85">
        {logo.label}
      </span>
    </div>
  );
}
