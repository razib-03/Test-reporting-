import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  ChevronLeft,
  GripVertical,
  Save,
  Lock,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { reports, categories, getReport } from '@/data/reportCatalog';
import { household, contacts, advisors } from '@/data/clients';
import { savedTemplates } from '@/data/templates';

const PERIODS = ['QTD', 'YTD', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', 'Since Inception'];
const CURRENCIES = ['CAD', 'USD', 'EUR', 'GBP'];
const DEFAULT_SECTIONS = ['Cover Page', 'Holdings', 'Performance', 'Allocation', 'Disclosures'];

// ── Local form primitives ──────────────────────────────────────────────
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#657381]">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[#9aa5b1]">{hint}</span>}
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border border-[#e9ecef] bg-white px-3 py-2 text-sm text-[#2e3338] outline-none transition-colors placeholder:text-[#9aa5b1] focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

function Section({
  title,
  step,
  children,
}: {
  title: string;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e9ecef] bg-white p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#2e3338]">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-[#0645ad]">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function TemplateBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = id && id !== 'new' ? savedTemplates.find((t) => t.id === id) : undefined;

  const [reportTypeId, setReportTypeId] = useState(existing?.reportTypeId ?? reports[0].id);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [sections, setSections] = useState<string[]>(existing?.sections ?? DEFAULT_SECTIONS);
  const [asOfDate, setAsOfDate] = useState('2026-05-31');
  const [period, setPeriod] = useState(existing?.period ?? 'YTD');
  const [currency, setCurrency] = useState(existing?.reportingCurrency ?? 'CAD');
  const [nativeCurrency, setNativeCurrency] = useState(false);
  const [accounts, setAccounts] = useState<string[]>(
    existing ? household.accounts.map((a) => a.id) : []
  );
  const [preparedFor, setPreparedFor] = useState(existing?.preparedFor ?? contacts[0].name);
  const [attention, setAttention] = useState(existing?.preparedFor ?? contacts[0].name);
  const [preparedBy, setPreparedBy] = useState<string[]>(
    existing?.preparedBy ?? [advisors[0].name]
  );
  const [documentVault, setDocumentVault] = useState(existing?.documentVault ?? false);

  const report = getReport(reportTypeId);

  const toggle = (arr: string[], v: string, setter: (x: string[]) => void, max?: number) => {
    if (arr.includes(v)) setter(arr.filter((x) => x !== v));
    else if (!max || arr.length < max) setter([...arr, v]);
  };

  return (
    <div className="min-h-full bg-[#f8f9fa] px-6 py-6">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <Link
          to="/templates"
          className="mb-3 inline-flex items-center gap-1 text-sm text-[#657381] transition-colors hover:text-[#0645ad]"
        >
          <ChevronLeft size={15} /> Back to templates
        </Link>
        <h1 className="mb-1 text-xl font-semibold text-[#2e3338]">
          {existing ? 'Edit Report Template' : 'New Report Template'}
        </h1>
        <p className="mb-5 text-sm text-[#657381]">
          Step 1 — Configure a reusable template. Once saved, generate the report on demand from
          Manage Clients → Print Report.
        </p>

        <div className="space-y-4">
          {/* 1. Template + Title */}
          <Section title="Template & Title" step={1}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Template (report type)" hint={report?.howCreated}>
                <select
                  value={reportTypeId}
                  onChange={(e) => setReportTypeId(e.target.value)}
                  className={inputCls}
                >
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
              </Field>
              <Field label="Title">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={report ? `e.g. ${report.name} — Okafor Family` : 'Template title'}
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* 2. Sections */}
          <Section title="Edit Sections" step={2}>
            <p className="mb-3 text-xs text-[#9aa5b1]">
              Reorder or remove sections within this report. Drag handles are illustrative.
            </p>
            <ul className="space-y-1.5">
              {sections.map((s) => (
                <li
                  key={s}
                  className="flex items-center gap-2 rounded-lg border border-[#e9ecef] bg-[#f8f9fa] px-3 py-2"
                >
                  <GripVertical size={14} className="cursor-grab text-[#cbd2d9]" />
                  <span className="flex-1 text-sm text-[#2e3338]">{s}</span>
                  <button
                    type="button"
                    onClick={() => setSections(sections.filter((x) => x !== s))}
                    className="text-xs font-medium text-[#9aa5b1] hover:text-[#d4183d]"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DEFAULT_SECTIONS.filter((s) => !sections.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSections([...sections, s])}
                  className="rounded-full border border-dashed border-[#cbd2d9] px-2.5 py-1 text-xs text-[#657381] hover:border-[#0645ad] hover:text-[#0645ad]"
                >
                  + {s}
                </button>
              ))}
            </div>
          </Section>

          {/* 3. Template Parameters */}
          <Section title="Template Parameters" step={3}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="As of Date">
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className={inputCls}
                />
              </Field>
              {report?.periodBased && (
                <Field label="Period">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className={inputCls}
                  >
                    {PERIODS.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Reporting Currency">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={inputCls}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Display Options">
                <label className="flex items-center gap-2 rounded-lg border border-[#e9ecef] bg-white px-3 py-2 text-sm text-[#2e3338]">
                  <input
                    type="checkbox"
                    checked={nativeCurrency}
                    onChange={(e) => setNativeCurrency(e.target.checked)}
                    className="h-4 w-4 rounded border-[#cbd2d9] text-[#0645ad]"
                  />
                  Display values in native currency
                </label>
              </Field>
            </div>
          </Section>

          {/* 4. Accounts */}
          <Section title="Accounts" step={4}>
            <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <Lock size={12} /> Account selection is locked after save — delete and recreate the
              template to change accounts.
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {household.accounts.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-2 rounded-lg border border-[#e9ecef] bg-white px-3 py-2 text-sm text-[#2e3338] hover:bg-[#f8f9fa]"
                >
                  <input
                    type="checkbox"
                    checked={accounts.includes(a.id)}
                    onChange={() => toggle(accounts, a.id, setAccounts)}
                    className="h-4 w-4 rounded border-[#cbd2d9] text-[#0645ad]"
                  />
                  <span className="flex-1">
                    {a.name}
                    <span className="ml-1 text-xs text-[#9aa5b1]">{a.id}</span>
                  </span>
                  <span className="rounded bg-[#eef1f6] px-1.5 py-0.5 text-[10px] font-medium text-[#657381]">
                    {a.type}
                  </span>
                </label>
              ))}
            </div>
          </Section>

          {/* 5. Prepared For */}
          <Section title="Prepared For (Cover Page)" step={5}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact" hint="Recipient on the cover page — must have a mailing address.">
                <select
                  value={preparedFor}
                  onChange={(e) => setPreparedFor(e.target.value)}
                  className={inputCls}
                >
                  {contacts.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Attention" hint="Defaults to the contact name, editable.">
                <input
                  value={attention}
                  onChange={(e) => setAttention(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* 6. Prepared By */}
          <Section title="Prepared By (Representatives)" step={6}>
            <p className="mb-2 text-xs text-[#9aa5b1]">Add up to 2 internal users.</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {advisors.map((u) => {
                const checked = preparedBy.includes(u.name);
                const disabled = !checked && preparedBy.length >= 2;
                return (
                  <label
                    key={u.id}
                    className={`flex items-center gap-2 rounded-lg border border-[#e9ecef] px-3 py-2 text-sm ${
                      disabled ? 'cursor-not-allowed bg-[#f8f9fa] opacity-50' : 'bg-white hover:bg-[#f8f9fa]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(preparedBy, u.name, setPreparedBy, 2)}
                      className="h-4 w-4 rounded border-[#cbd2d9] text-[#0645ad]"
                    />
                    <span className="flex-1 text-[#2e3338]">
                      {u.name}
                      <span className="ml-1 text-xs text-[#9aa5b1]">{u.title}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </Section>

          {/* 7. Document Vault */}
          <Section title="Document Vault" step={7}>
            <label className="flex items-start gap-3 rounded-lg border border-[#e9ecef] bg-white px-3 py-3">
              <input
                type="checkbox"
                checked={documentVault}
                onChange={(e) => setDocumentVault(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#cbd2d9] text-[#0645ad]"
              />
              <span className="text-sm text-[#2e3338]">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={14} className="text-emerald-600" /> Enable Document Vault
                </span>
                <span className="mt-0.5 block text-xs text-[#9aa5b1]">
                  Recipients receive individual reports; “Shared With” contacts get portal access.
                </span>
              </span>
            </label>
          </Section>

          {/* Footer note + actions */}
          <div className="flex items-center gap-1.5 text-xs text-[#9aa5b1]">
            <Info size={12} /> This is a prototype — saving navigates back without persisting.
          </div>
          <div className="flex items-center justify-end gap-2 pb-6">
            <button
              type="button"
              onClick={() => navigate('/templates')}
              className="rounded-lg border border-[#e9ecef] bg-white px-4 py-2 text-sm font-medium text-[#657381] hover:bg-[#f8f9fa]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => navigate('/templates')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0645ad] px-4 py-2 text-sm font-medium text-white hover:bg-[#053a91]"
            >
              <Save size={15} /> Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
