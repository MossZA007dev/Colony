import { useState } from 'react';
import './OnboardingPage.css';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const ONBOARDING_QUESTIONS: { id: string; q: string; choices: string[] }[] = [
  { id: 'use', q: 'What do you want to use Colony for?', choices: ['Build a startup or business', 'Automate daily work', 'Research and analysis', 'Content and marketing', 'Personal productivity', 'Other'] },
  { id: 'role', q: 'What best describes you?', choices: ['Solo founder', 'Student', 'Creator', 'Developer', 'Small business owner', 'Team operator', 'Other'] },
  { id: 'help', q: 'What kind of AI help do you want most?', choices: ['AI agent team', 'File/screenshot analysis', 'Workflow automation', 'Research assistant', 'Business reporting', 'Device/tool operation'] },
  { id: 'level', q: 'How technical are you?', choices: ['Non-technical', 'Beginner', 'Intermediate', 'Advanced', 'Developer'] },
  { id: 'first', q: 'What should AI Ant create first for you?', choices: ['New project', 'AI agent team', 'Workflow', 'Report', 'Research plan', 'I want to chat first'] },
];

export function OnboardingPage({ onComplete, onSkip }: { onComplete: (answers: Record<string, string>) => void; onSkip: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const total = ONBOARDING_QUESTIONS.length;
  const current = ONBOARDING_QUESTIONS[step];

  const pick = (choice: string) => {
    const next = { ...answers, [current.id]: choice };
    setAnswers(next);
    if (step < total - 1) setStep(step + 1);
    else onComplete(next);
  };

  return (
    <div className="relative grid min-h-screen place-items-center bg-[#060609] px-5 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_35%,rgba(79,158,255,0.07),transparent)]" />
      <div className="relative z-10 w-full max-w-lg">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/assets/logos/Colony white no text.png" width={32} height={32} alt="Colony" draggable={false} />
            <span className="font-heading text-lg font-extrabold">Colony</span>
          </div>
          <button onClick={onSkip} className="text-[13px] text-white/40 transition hover:text-white/70">Skip</button>
        </div>

        <div className="mb-6 flex gap-1.5">
          {ONBOARDING_QUESTIONS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-[#4f9eff]' : 'bg-white/10'}`} />
          ))}
        </div>

        <p className="mb-1 text-[13px] font-medium text-white/40">Question {step + 1} of {total}</p>
        <h1 className="mb-7 font-heading text-3xl font-extrabold leading-tight">{current.q}</h1>

        <div className="space-y-2.5">
          {current.choices.map((choice) => (
            <button
              key={choice}
              onClick={() => pick(choice)}
              className="flex w-full items-center justify-between rounded-xl border border-white/[0.1] bg-white/[0.04] px-5 py-3.5 text-left text-sm font-medium text-white/85 transition hover:border-[#4f9eff]/40 hover:bg-white/[0.07]"
            >
              {choice}
              <ArrowRight className="h-4 w-4 text-white/30" />
            </button>
          ))}
        </div>

        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="mt-6 flex items-center gap-1.5 text-[13px] text-white/45 transition hover:text-white/80">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        )}
      </div>
    </div>
  );
}

