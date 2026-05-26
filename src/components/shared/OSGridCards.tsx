import React from 'react';
import { resolveModelForCapability, CAPABILITY_LABELS, CAPABILITY_ROUTES, type AgentCapability } from '../../lib/aiOrchestration';
import { skillsForCapabilities, SkillModelPills } from '../../lib/modelDisplay';

export type OSCard = {
  title: string;
  subtitle: string;
  meta?: string;
  status?: string;
  tone?: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';
  capabilities?: AgentCapability[];
};

const toneClass: Record<NonNullable<OSCard['tone']>, string> = {
  blue: 'border-blue-400/20 bg-blue-400/[0.06] text-blue-200',
  violet: 'border-violet-400/20 bg-violet-400/[0.06] text-violet-200',
  emerald: 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200',
  amber: 'border-amber-400/20 bg-amber-400/[0.06] text-amber-200',
  rose: 'border-rose-400/20 bg-rose-400/[0.06] text-rose-200',
};

export function OSGridCards({ cards }: { cards: OSCard[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div key={card.title} className="rounded-[20px] border border-white/[0.07] bg-white/[0.03] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading text-base font-bold text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/45">{card.subtitle}</p>
            </div>
            {card.status && <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${toneClass[card.tone ?? 'violet']}`}>{card.status}</span>}
          </div>
          {card.meta && <p className="mt-4 text-xs font-semibold text-white/32">{card.meta}</p>}
          {card.capabilities && <SkillModelPills skills={skillsForCapabilities(card.capabilities)} compact />}
          {card.capabilities && (
            <div className="mt-3 space-y-1.5">
              {card.capabilities.slice(0, 4).map((capability) => {
                const resolved = resolveModelForCapability(capability);
                const toolLike = capability === 'file_reading' || capability === 'browser_action' || capability === 'connected_tool_action';
                return (
                  <div key={capability} className="rounded-[10px] border border-white/[0.06] bg-black/15 px-3 py-2 text-[10px] text-white/45">
                    <span className="font-bold text-white/65">{CAPABILITY_LABELS[capability]}</span>
                    <span className="ml-2">{toolLike ? 'Tool' : 'Model'}: {resolved.providerMode === 'auto' ? 'Auto -> ' : 'Manual -> '}{resolved.displayName}</span>
                    {CAPABILITY_ROUTES[capability].approvalRequired && <span className="ml-2 text-amber-200/80">Approval required</span>}
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-5 flex gap-2">
            <button className="rounded-[10px] bg-[#ffffff] px-3 py-2 text-xs font-bold text-[#070B14] hover:bg-[#f0f2ff]">Open</button>
            <button className="rounded-[10px] border border-white/[0.10] px-3 py-2 text-xs font-semibold text-white/50">Details</button>
          </div>
        </div>
      ))}
    </div>
  );
}
