import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentMessage } from '@/agent/types';

interface AgentChatProps {
  messages: AgentMessage[];
  starters: string[];
  onSend: (text: string) => void;
}

/** Render a string with **bold** spans. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <strong key={i} className="font-semibold">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export default function AgentChat({ messages, starters, onSend }: AgentChatProps) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setInput('');
  };

  const lastAgent = [...messages].reverse().find((m) => m.role === 'agent');
  const quickReplies = lastAgent?.quickReplies ?? [];

  return (
    <div className="flex h-full flex-col rounded-xl border border-[#e9ecef] bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#f0f2f4] px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 text-white">
          <Sparkles size={15} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#2e3338]">Report assistant</p>
          <p className="text-[11px] text-[#9aa5b1]">Describe the report you need</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Avatar role="agent" />
              <Bubble role="agent">
                Hi — tell me what you'd like to report on and I'll set it up. For example:
              </Bubble>
            </div>
            <div className="flex flex-wrap gap-1.5 pl-9">
              {starters.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-full border border-[#e9ecef] bg-[#f8f9fa] px-2.5 py-1 text-xs text-[#657381] transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={cn('flex gap-2', m.role === 'user' && 'flex-row-reverse')}>
            <Avatar role={m.role} />
            <Bubble role={m.role}>
              <RichText text={m.text} />
            </Bubble>
          </div>
        ))}

        {/* Quick replies under the latest agent turn */}
        {quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-9">
            {quickReplies.map((qr) => (
              <button
                key={qr.label}
                onClick={() => submit(qr.value)}
                className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100"
              >
                {qr.label}
              </button>
            ))}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-[#f0f2f4] p-3">
        <div className="flex items-center gap-2 rounded-lg border border-[#e9ecef] bg-[#f8f9fa] px-3 py-2 focus-within:border-violet-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-100">
          <Sparkles size={14} className="text-[#9aa5b1]" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit(input)}
            placeholder="Describe a report, or adjust this one…"
            className="flex-1 bg-transparent text-sm text-[#2e3338] outline-none placeholder:text-[#9aa5b1]"
          />
          <button
            onClick={() => submit(input)}
            disabled={!input.trim()}
            className="rounded-md bg-violet-600 p-1.5 text-white transition-colors hover:bg-violet-700 disabled:opacity-40"
            aria-label="Send"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Avatar({ role }: { role: 'user' | 'agent' }) {
  return role === 'agent' ? (
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 text-white">
      <Sparkles size={13} />
    </div>
  ) : (
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eef1f6] text-[#657381]">
      <UserIcon size={13} />
    </div>
  );
}

function Bubble({ role, children }: { role: 'user' | 'agent'; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'max-w-[82%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
        role === 'agent'
          ? 'rounded-tl-sm bg-[#f5f3ff] text-[#2e3338]'
          : 'rounded-tr-sm bg-[#0645ad] text-white'
      )}
    >
      {children}
    </div>
  );
}
