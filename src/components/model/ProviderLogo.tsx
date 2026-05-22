import React from 'react';

// ── ProviderLogo (model-routing UI) ───────────────────────────────────────────
// Real SVGs live in public/assets/Ai logo/. Mapping is keyed by lowercase
// provider id; the component falls back to the provider initial when the file
// is missing or fails to load. Drop new SVGs into the folder and the UI picks
// them up automatically.
// Path is pre-encoded (the folder name contains a space) so browsers/Vite
// resolve it reliably without relying on automatic URL encoding.
const PROVIDER_LOGO_DIR = '/assets/Ai%20logo';
// Filenames match the actual SVGs in public/assets/Ai logo/ — they use PascalCase
// and some contain spaces (encoded as %20). Vite serves these case-sensitively.
const logoFile = (name: string) => `${PROVIDER_LOGO_DIR}/${name.replace(/ /g, '%20')}`;
const PROVIDER_LOGO_PATHS: Record<string, string> = {
  openai:           logoFile('OpenAI.svg'),
  chatgpt:          logoFile('ChatGPT.svg'),
  google:           logoFile('Google.svg'),
  gemini:           logoFile('Gemini.svg'),
  deepseek:         logoFile('DeepSeek.svg'),
  perplexity:       logoFile('Perplexity.svg'),
  anthropic:        logoFile('ANTHROPIC.svg'),
  claude:           logoFile('Claude.svg'),
  xai:              logoFile('xAI.svg'),
  grok:             logoFile('Grok.svg'),
  mistral:          logoFile('Mistral AI.svg'),
  cohere:           logoFile('Cohere.svg'),
  stability:        logoFile('stability.ai.svg'),
  zapier:           logoFile('Zapier.svg'),
  cursor:           logoFile('Cursor.svg'),
  codex:            logoFile('Codex.svg'),
  huggingface:      logoFile('Hugging Face.svg'),
  fireworks:        logoFile('Fireworks AI.svg'),
  manus:            logoFile('manus.svg'),
  copilot:          logoFile('Microsoft Copilot.svg'),
  microsoft:        logoFile('Microsoft Copilot.svg'),
  kimi:             logoFile('Kimi.svg'),
  qwen:             logoFile('Qwen.svg'),
  minimax:          logoFile('MiniMax.svg'),
  antigravity:      logoFile('Antigravity.svg'),
  'google-antigravity': logoFile('Google Antigravity.svg'),
  glean:            logoFile('Glean.svg'),
  jasper:           logoFile('Jasper.svg'),
  notion:           logoFile('Notion.svg'),
  apple:            logoFile('Apple.svg'),
  'apple-intelligence': logoFile('Apple Intelligence.svg'),
  meta:             logoFile('Meta.svg'),
  nvidia:           logoFile('Nvidia.svg'),
  tesla:            logoFile('Tesla.svg'),
  poe:              logoFile('Poe.svg'),
};

// Single source of truth for the provider logo badge. White rounded tile,
// subtle border, soft drop shadow, with inner breathing space so logos sit
// cleanly centered. Used by ModelChip, ModelCard, the One-Man Enterprise
// setup matching modal, and any future provider/model surface.
export function ProviderLogo({ provider, size = 'sm' }: { provider?: string; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const px = size === 'xs' ? 18 : size === 'sm' ? 24 : size === 'md' ? 32 : 40;
  const radius = size === 'lg' ? 10 : size === 'md' ? 9 : 7;
  const key = (provider ?? '').toLowerCase();
  const src = PROVIDER_LOGO_PATHS[key];
  const initial = (provider?.trim()?.[0] ?? '?').toUpperCase();
  const [errored, setErrored] = React.useState(false);
  // All visual properties pinned via inline style so the badge stays a clean
  // white tile regardless of Tailwind cascade or parent classes (a `bg-white`
  // class can be defeated by composite/gradient parents).
  return (
    <span
      title={provider}
      className="grid shrink-0 place-items-center overflow-hidden text-[10px] font-bold"
      style={{
        width: px,
        height: px,
        borderRadius: radius,
        padding: Math.max(1, Math.round(px * 0.08)),
        backgroundColor: '#ffffff',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        color: '#0a101d',
      }}>
      {src && !errored ? (
        <img src={src} alt={provider} draggable={false}
          onError={() => { setErrored(true); if ((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) console.warn(`[ProviderLogo] missing asset: ${src}`); }}
          className="object-contain"
          style={{ width: '100%', height: '100%' }} />
      ) : initial}
    </span>
  );
}
