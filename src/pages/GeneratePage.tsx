import { useState } from 'react';
import { Link } from 'react-router';
import {
  Download,
  Printer,
  CheckCircle2,
  Loader2,
  FileText,
  Clock,
} from 'lucide-react';
import { savedTemplates, generatedReports } from '@/data/templates';
import { reports, getReport } from '@/data/reportCatalog';
import { household, contacts, advisors } from '@/data/clients';
import { formatDate } from '@/lib/format';

const inputCls =
  'w-full rounded-lg border border-[#e9ecef] bg-white px-3 py-2 text-sm text-[#2e3338] outline-none transition-colors placeholder:text-[#9aa5b1] focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#657381]">
        {label}
      </span>
      {children}
    </label>
  );
}

const ENTITIES = [
  { id: household.id, label: `${household.name} (Household)` },
  ...household.accounts.map((a) => ({ id: a.id, label: `${a.name} · ${a.id}` })),
];

export default function GeneratePage() {
  const [entity, setEntity] = useState(ENTITIES[0].id);
  const [asOfDate, setAsOfDate] = useState('2026-05-31');
  const [templateId, setTemplateId] = useState(savedTemplates[0]?.id ?? '');
  const [titleOverride, setTitleOverride] = useState('');
  const [recipient, setRecipient] = useState(contacts[0].name);
  const [representative, setRepresentative] = useState(advisors[0].name);
  const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle');

  const template = savedTemplates.find((t) => t.id === templateId);
  const report = template ? getReport(template.reportTypeId) : getReport(reports[0].id);
  const entityLabel = ENTITIES.find((e) => e.id === entity)?.label ?? '';
  const effectiveTitle =
    titleOverride.trim() || template?.title || report?.name || 'Report';

  const handleGenerate = () => {
    setStatus('generating');
    setTimeout(() => setStatus('done'), 1400);
  };

  return (
    <div className="min-h-full bg-[#f8f9fa] px-6 py-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-1 text-xl font-semibold text-[#2e3338]">Generate Report</h1>
        <p className="mb-5 text-sm text-[#657381]">
          Step 2 — Generate a report on demand. Pick the entity, an as-of date and a template, then
          download.
        </p>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* Form */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[#e9ecef] bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-[#2e3338]">Report Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Entity">
                  <select value={entity} onChange={(e) => setEntity(e.target.value)} className={inputCls}>
                    {ENTITIES.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="As of Date">
                  <input
                    type="date"
                    value={asOfDate}
                    onChange={(e) => setAsOfDate(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Template">
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className={inputCls}
                  >
                    {savedTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Title (optional override)">
                  <input
                    value={titleOverride}
                    onChange={(e) => setTitleOverride(e.target.value)}
                    placeholder={template?.title ?? 'Default template title'}
                    className={inputCls}
                  />
                </Field>
                <Field label="Recipient (Prepared For)">
                  <select value={recipient} onChange={(e) => setRecipient(e.target.value)} className={inputCls}>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Representative (Prepared By)">
                  <select
                    value={representative}
                    onChange={(e) => setRepresentative(e.target.value)}
                    className={inputCls}
                  >
                    {advisors.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            {/* Recently generated */}
            <div className="rounded-xl border border-[#e9ecef] bg-white p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#2e3338]">
                <Clock size={15} className="text-[#9aa5b1]" /> Recently Generated
              </h2>
              <ul className="divide-y divide-[#f0f2f4]">
                {generatedReports.map((g) => {
                  const r = getReport(g.reportTypeId);
                  return (
                    <li key={g.id} className="flex items-center gap-3 py-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0645ad]">
                        <FileText size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#2e3338]">{g.title}</p>
                        <p className="truncate text-xs text-[#9aa5b1]">
                          {r?.name} · {g.account} · as of {formatDate(g.asOfDate)}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-[#9aa5b1]">{formatDate(g.generatedAt)}</span>
                      {r && (
                        <Link
                          to={`/library/${r.id}`}
                          className="shrink-0 rounded-md border border-[#e9ecef] px-2 py-1 text-xs font-medium text-[#657381] hover:border-[#0645ad] hover:text-[#0645ad]"
                        >
                          View
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Preview / action panel */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-xl border border-[#e9ecef] bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-[#2e3338]">Preview</h2>
              <dl className="space-y-2.5 text-sm">
                <Row label="Title" value={effectiveTitle} />
                <Row label="Report Type" value={report?.name ?? '—'} />
                <Row label="Entity" value={entityLabel} />
                <Row label="As of Date" value={formatDate(asOfDate)} />
                <Row label="Currency" value={template?.reportingCurrency ?? 'CAD'} />
                <Row label="Prepared For" value={recipient} />
                <Row label="Prepared By" value={representative} />
                {report?.periodBased && template?.period && (
                  <Row label="Period" value={template.period} />
                )}
              </dl>

              <div className="mt-4 space-y-2">
                {status === 'done' ? (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
                    <CheckCircle2 size={16} />
                    Report generated & downloaded.
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={status === 'generating'}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0645ad] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#053a91] disabled:opacity-70"
                  >
                    {status === 'generating' ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Generating…
                      </>
                    ) : (
                      <>
                        <Download size={16} /> Generate & Download
                      </>
                    )}
                  </button>
                )}
                {report && status !== 'generating' && (
                  <Link
                    to={`/library/${report.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e9ecef] bg-white px-4 py-2.5 text-sm font-medium text-[#657381] hover:bg-[#f8f9fa]"
                  >
                    <Printer size={15} /> Preview sample output
                  </Link>
                )}
              </div>
              <p className="mt-3 text-xs text-[#9aa5b1]">
                Generated files download to your local Downloads folder.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-[#9aa5b1]">{label}</dt>
      <dd className="text-right font-medium text-[#2e3338]">{value}</dd>
    </div>
  );
}
