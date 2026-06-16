import { Download, Save, Check, Loader2, FileSearch } from 'lucide-react';
import { reports, categories, getReport } from '@/data/reportCatalog';
import { household, contacts, advisors } from '@/data/clients';
import { PERIODS, CURRENCIES } from '@/agent/constants';
import type { ReportConfigDraft } from '@/agent/types';
import ReportShell from '@/components/report/ReportShell';
import ReportRenderer from '@/components/report/ReportRenderer';

type GenStatus = 'idle' | 'generating' | 'done';

interface ConfigPreviewProps {
  draft: ReportConfigDraft;
  ready: boolean;
  status: GenStatus;
  onChange: (patch: Partial<ReportConfigDraft>) => void;
  onGenerate: () => void;
  onSaveTemplate: () => void;
}

const selectCls =
  'w-full rounded-lg border border-[#e9ecef] bg-white px-2.5 py-1.5 text-sm text-[#2e3338] outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-3 py-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-[#657381]">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default function ConfigPreview({
  draft,
  ready,
  status,
  onChange,
  onGenerate,
  onSaveTemplate,
}: ConfigPreviewProps) {
  const report = draft.reportTypeId ? getReport(draft.reportTypeId) : undefined;

  const toggleAccount = (id: string) => {
    const accounts = draft.accounts.includes(id)
      ? draft.accounts.filter((a) => a !== id)
      : [...draft.accounts, id];
    const entity =
      accounts.length === household.accounts.length
        ? household.name
        : accounts.length === 0
          ? undefined
          : `${accounts.length} accounts`;
    onChange({ accounts, entity });
  };

  const togglePreparedBy = (name: string) => {
    const has = draft.preparedBy.includes(name);
    if (has) onChange({ preparedBy: draft.preparedBy.filter((n) => n !== name) });
    else if (draft.preparedBy.length < 2) onChange({ preparedBy: [...draft.preparedBy, name] });
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      {/* Configuration */}
      <div className="rounded-xl border border-[#e9ecef] bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#2e3338]">Configuration</h2>
          {ready ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <Check size={11} /> Ready
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              In progress
            </span>
          )}
        </div>

        <div className="divide-y divide-[#f5f6f8]">
          <Row label="Report">
            <select
              value={draft.reportTypeId ?? ''}
              onChange={(e) => onChange({ reportTypeId: e.target.value })}
              className={selectCls}
            >
              <option value="" disabled>
                Not selected
              </option>
              {categories.map((cat) => (
                <optgroup key={cat.id} label={`${cat.index}. ${cat.name}`}>
                  {reports
                    .filter((r) => r.category === cat.id)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </Row>

          {report?.periodBased && (
            <Row label="Period">
              <select
                value={draft.period ?? ''}
                onChange={(e) => onChange({ period: e.target.value })}
                className={selectCls}
              >
                <option value="" disabled>
                  Choose a period
                </option>
                {PERIODS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Row>
          )}

          <Row label="As of">
            <input
              type="date"
              value={draft.asOfDate}
              onChange={(e) => onChange({ asOfDate: e.target.value })}
              className={selectCls}
            />
          </Row>

          <Row label="Currency">
            <select
              value={draft.currency}
              onChange={(e) => onChange({ currency: e.target.value })}
              className={selectCls}
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Row>

          <Row label="Accounts">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-[#e9ecef] px-2.5 py-1.5 text-sm text-[#2e3338]">
                <span>{draft.entity ?? <span className="text-[#9aa5b1]">Not selected</span>}</span>
                <span className="text-xs text-[#9aa5b1]">{draft.accounts.length} selected</span>
              </summary>
              <div className="mt-1.5 space-y-1">
                {household.accounts.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-[#2e3338] hover:bg-[#f8f9fa]"
                  >
                    <input
                      type="checkbox"
                      checked={draft.accounts.includes(a.id)}
                      onChange={() => toggleAccount(a.id)}
                      className="h-3.5 w-3.5 rounded border-[#cbd2d9] text-[#0645ad]"
                    />
                    <span className="flex-1 truncate">{a.name}</span>
                    <span className="rounded bg-[#eef1f6] px-1.5 py-0.5 text-[10px] text-[#657381]">{a.type}</span>
                  </label>
                ))}
              </div>
            </details>
          </Row>

          <Row label="Prepared for">
            <select
              value={draft.preparedFor ?? ''}
              onChange={(e) => onChange({ preparedFor: e.target.value })}
              className={selectCls}
            >
              <option value="" disabled>
                Choose a recipient
              </option>
              {contacts.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </Row>

          <Row label="Prepared by">
            <div className="flex flex-wrap gap-1.5">
              {advisors.map((u) => {
                const checked = draft.preparedBy.includes(u.name);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => togglePreparedBy(u.name)}
                    className={
                      'rounded-full border px-2.5 py-1 text-xs transition-colors ' +
                      (checked
                        ? 'border-[#0645ad] bg-blue-50 text-[#0645ad]'
                        : 'border-[#e9ecef] text-[#657381] hover:border-[#0645ad]')
                    }
                  >
                    {u.name}
                  </button>
                );
              })}
            </div>
          </Row>

          <Row label="Document Vault">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#2e3338]">
              <input
                type="checkbox"
                checked={draft.documentVault}
                onChange={(e) => onChange({ documentVault: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-[#cbd2d9] text-[#0645ad]"
              />
              {draft.documentVault ? 'Enabled' : 'Disabled'}
            </label>
          </Row>
        </div>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2 border-t border-[#f0f2f4] pt-3">
          {status === 'done' ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              <Check size={15} /> Generated & downloaded
            </span>
          ) : (
            <button
              type="button"
              onClick={onGenerate}
              disabled={!ready || status === 'generating'}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0645ad] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#053a91] disabled:opacity-40"
            >
              {status === 'generating' ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Download size={15} /> Generate & Download
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onSaveTemplate}
            disabled={!draft.reportTypeId}
            className="inline-flex items-center gap-2 rounded-lg border border-[#e9ecef] bg-white px-4 py-2 text-sm font-medium text-[#657381] transition-colors hover:bg-[#f8f9fa] disabled:opacity-40"
          >
            <Save size={15} /> Save as template
          </button>
        </div>
      </div>

      {/* Sample preview */}
      <div className="rounded-xl border border-[#e9ecef] bg-white p-4">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[#2e3338]">
          <FileSearch size={15} className="text-[#0645ad]" /> Sample preview
        </h2>
        {report ? (
          <ReportShell title={draft.title || report.name} asOfDate={draft.asOfDate} currency={draft.currency}>
            <ReportRenderer report={report} />
          </ReportShell>
        ) : (
          <div className="rounded-lg border border-dashed border-[#e9ecef] py-10 text-center text-sm text-[#9aa5b1]">
            Pick a report on the left to preview a sample.
          </div>
        )}
      </div>
    </div>
  );
}
