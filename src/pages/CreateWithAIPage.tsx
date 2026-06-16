import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Sparkles, SlidersHorizontal } from 'lucide-react';
import AgentChat from '@/components/agent/AgentChat';
import ConfigPreview from '@/components/agent/ConfigPreview';
import { simulatedConfigAgent, isDraftReady } from '@/agent/configAgent';
import { emptyDraft } from '@/agent/types';
import type { AgentMessage, ReportConfigDraft } from '@/agent/types';

const agent = simulatedConfigAgent;
const localId = () => `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export default function CreateWithAIPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [draft, setDraft] = useState<ReportConfigDraft>(emptyDraft());
  const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle');

  const ready = isDraftReady(draft);

  const handleSend = (text: string) => {
    setMessages((m) => [...m, { id: localId(), role: 'user', text }]);
    Promise.resolve(agent.interpret(text, draft)).then((turn) => {
      setDraft(turn.draft);
      setMessages((m) => [...m, turn.message]);
      setStatus('idle');
    });
  };

  const handleChange = (patch: Partial<ReportConfigDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setStatus('idle');
  };

  const handleGenerate = () => {
    setStatus('generating');
    setTimeout(() => setStatus('done'), 1400);
  };

  return (
    <div className="flex h-full flex-col bg-[#f8f9fa]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-[#2e3338]">
            <Sparkles size={18} className="text-violet-600" /> Create with AI
          </h1>
          <p className="mt-0.5 text-sm text-[#657381]">
            Describe the report you need — the assistant configures it and previews a sample.
          </p>
        </div>
        <Link
          to="/templates/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#e9ecef] bg-white px-3 py-2 text-sm font-medium text-[#657381] transition-colors hover:bg-gray-50"
        >
          <SlidersHorizontal size={15} /> Advanced form
        </Link>
      </div>

      {/* Two-pane */}
      <div className="grid min-h-0 flex-1 gap-5 px-6 pb-6 lg:grid-cols-[minmax(0,400px)_1fr]">
        <div className="min-h-[360px] lg:min-h-0">
          <AgentChat messages={messages} starters={agent.starterPrompts()} onSend={handleSend} />
        </div>
        <ConfigPreview
          draft={draft}
          ready={ready}
          status={status}
          onChange={handleChange}
          onGenerate={handleGenerate}
          onSaveTemplate={() => navigate('/templates')}
        />
      </div>
    </div>
  );
}
