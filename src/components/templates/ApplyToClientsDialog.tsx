import { useState } from 'react';
import { X, Users, Loader2, Check, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { clients } from '@/data/clients';
import { formatCurrency } from '@/lib/format';
import type { SavedTemplate } from '@/data/types';

interface ApplyToClientsDialogProps {
  template: SavedTemplate;
  onClose: () => void;
}

/**
 * Apply one template across many clients in a single pass (mock batch generate).
 * The advisor's #1 workflow: same report, lots of clients, a few clicks.
 */
export default function ApplyToClientsDialog({ template, onClose }: ApplyToClientsDialogProps) {
  const [selected, setSelected] = useState<string[]>(clients.map((c) => c.id));
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');

  const allOn = selected.length === clients.length;
  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleAll = () => setSelected(allOn ? [] : clients.map((c) => c.id));

  const run = () => {
    setStatus('running');
    setTimeout(() => setStatus('done'), 1500);
  };

  const selectedClients = clients.filter((c) => selected.includes(c.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#f0f2f4] px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#2e3338]">
              <Users size={16} className="text-[#0645ad]" /> Apply to clients
            </h2>
            <p className="mt-0.5 text-xs text-[#657381]">
              {template.title} · {template.reportingCurrency}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-[#9aa5b1] hover:bg-gray-100 hover:text-[#657381]">
            <X size={16} />
          </button>
        </div>

        {status === 'done' ? (
          <div className="px-5 py-8 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check size={22} />
            </div>
            <p className="text-sm font-semibold text-[#2e3338]">
              Generated for {selectedClients.length} {selectedClients.length === 1 ? 'client' : 'clients'}
            </p>
            <p className="mt-1 text-xs text-[#657381]">
              “{template.title}” has been produced for each selected client and queued for delivery.
            </p>
            <div className="mt-4 max-h-40 space-y-1 overflow-auto text-left">
              {selectedClients.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-lg bg-[#f8f9fa] px-3 py-1.5 text-xs text-[#2e3338]">
                  <Check size={12} className="text-emerald-600" /> {c.name}
                </div>
              ))}
            </div>
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-lg bg-[#0645ad] px-4 py-2 text-sm font-medium text-white hover:bg-[#053a91]"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Client list */}
            <div className="px-5 py-3">
              <button
                onClick={toggleAll}
                className="mb-2 text-xs font-medium text-[#0645ad] hover:underline"
              >
                {allOn ? 'Clear all' : 'Select all'}
              </button>
              <div className="max-h-64 space-y-1 overflow-auto">
                {clients.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[#f8f9fa]"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={() => toggle(c.id)}
                      className="h-4 w-4 rounded border-[#cbd2d9] text-[#0645ad]"
                    />
                    <span className="flex-1 text-sm text-[#2e3338]">{c.name}</span>
                    <span className="text-[11px] text-[#9aa5b1]">{c.advisor}</span>
                    <span className="w-20 text-right text-[11px] tabular-nums text-[#657381]">
                      {formatCurrency(c.aum)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-[#f0f2f4] px-5 py-3">
              <span className="text-xs text-[#657381]">
                {selected.length} of {clients.length} selected
              </span>
              <button
                onClick={run}
                disabled={selected.length === 0 || status === 'running'}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg bg-[#0645ad] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#053a91] disabled:opacity-40'
                )}
              >
                {status === 'running' ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Download size={15} /> Generate {selected.length} {selected.length === 1 ? 'report' : 'reports'}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
