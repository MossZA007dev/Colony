import { useState } from 'react';
import { ArrowUp, Mic, Paperclip } from 'lucide-react';

export function OperatorCommandBar({
  placeholder,
  onSubmit,
  disabled = false,
}: {
  placeholder: string;
  onSubmit: (text: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');
  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  };
  return (
    <div className="shrink-0 border-t border-white/[0.07] bg-[#070b15]/85 px-5 py-3 backdrop-blur-md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-end gap-2 rounded-[14px] border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 transition-colors focus-within:border-violet-400/35 focus-within:bg-white/[0.035]"
      >
        <button
          type="button"
          aria-label="Attach"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] text-white/45 transition-colors hover:bg-white/[0.05] hover:text-white/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
        >
          <Paperclip className="h-3.5 w-3.5" />
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="min-h-[24px] max-h-32 flex-1 resize-none bg-transparent text-[13.5px] text-white/90 outline-none placeholder:text-white/35 disabled:opacity-60"
        />
        <button
          type="button"
          aria-label="Voice input"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] text-white/45 transition-colors hover:bg-white/[0.05] hover:text-white/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
        >
          <Mic className="h-3.5 w-3.5" />
        </button>
        <button
          type="submit"
          aria-label="Send"
          disabled={!text.trim() || disabled}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-violet-600 text-white transition-colors hover:bg-violet-500 disabled:opacity-35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-300/40"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
