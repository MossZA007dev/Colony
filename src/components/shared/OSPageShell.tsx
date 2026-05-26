import React from 'react';

export function OSPageShell({ eyebrow, title, subtitle, action, children }: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-[#070B14] px-6 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300/60">{eyebrow}</p>
            <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-white">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">{subtitle}</p>
          </div>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}
