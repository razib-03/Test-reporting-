import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Plus, Search, FileText, ShieldCheck, ChevronRight, Lock, Copy, Users } from 'lucide-react';
import { savedTemplates } from '@/data/templates';
import { getReport, getCategory } from '@/data/reportCatalog';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import ApplyToClientsDialog from '@/components/templates/ApplyToClientsDialog';
import type { SavedTemplate } from '@/data/types';

type ScopeFilter = 'all' | 'firm' | 'advisor';

const SCOPE_TABS: { id: ScopeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'firm', label: 'Firm' },
  { id: 'advisor', label: 'My templates' },
];

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [applyTemplate, setApplyTemplate] = useState<SavedTemplate | null>(null);

  const filtered = savedTemplates.filter((t) => {
    if (scope !== 'all' && t.scope !== scope) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const reportName = getReport(t.reportTypeId)?.name.toLowerCase() ?? '';
    return (
      t.title.toLowerCase().includes(q) ||
      t.accounts.toLowerCase().includes(q) ||
      reportName.includes(q)
    );
  });

  const count = (s: ScopeFilter) => (s === 'all' ? savedTemplates.length : savedTemplates.filter((t) => t.scope === s).length);

  return (
    <div className="min-h-full bg-[#f8f9fa] px-6 py-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#2e3338]">Report Templates</h1>
            <p className="mt-1 text-sm text-[#657381]">
              Configure a template once, then generate it on demand — or apply it across many clients
              at once. Firm-standard templates are published by Compliance.
            </p>
          </div>
          <Link
            to="/templates/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#0645ad] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#053a91]"
          >
            <Plus size={16} />
            New Template
          </Link>
        </div>

        {/* Scope tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {SCOPE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setScope(tab.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                scope === tab.id
                  ? 'border-[#0645ad] bg-[#0645ad] text-white'
                  : 'border-[#e9ecef] bg-white text-[#657381] hover:border-[#0645ad] hover:text-[#0645ad]'
              )}
            >
              {tab.label} ({count(tab.id)})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#e9ecef] bg-white px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <Search size={15} className="text-[#9aa5b1]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates by title, report type or account…"
            className="flex-1 bg-transparent text-sm text-[#2e3338] outline-none placeholder:text-[#9aa5b1]"
          />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[#e9ecef] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e9ecef] bg-[#f8f9fa] text-left text-xs font-semibold uppercase tracking-wide text-[#9aa5b1]">
                <th className="px-4 py-2.5">Template</th>
                <th className="px-4 py-2.5">Report Type</th>
                <th className="px-4 py-2.5">Scope</th>
                <th className="px-4 py-2.5">Updated</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const report = getReport(t.reportTypeId);
                const category = report ? getCategory(report.category) : undefined;
                const isFirm = t.scope === 'firm';
                return (
                  <tr key={t.id} className="group border-b border-[#f0f2f4] last:border-0 hover:bg-[#f8f9fa]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0645ad]">
                          <FileText size={15} />
                        </span>
                        <span className="flex flex-col">
                          <span className="font-medium text-[#2e3338]">{t.title}</span>
                          <span className="mt-0.5 flex items-center gap-1.5">
                            {t.documentVault && (
                              <span className="inline-flex w-fit items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                                <ShieldCheck size={10} /> Vault
                              </span>
                            )}
                            <span className="text-xs text-[#9aa5b1]">{t.accounts}</span>
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[#2e3338]">{report?.name ?? '—'}</span>
                      {category && <span className="mt-0.5 block text-xs text-[#9aa5b1]">{category.name}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {isFirm ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                          <Lock size={11} /> Firm standard
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#eef1f6] px-2 py-0.5 text-[11px] font-medium text-[#657381]">
                          {t.owner ?? 'Advisor'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#657381]">{formatDate(t.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setApplyTemplate(t)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e9ecef] bg-white px-2.5 py-1.5 text-xs font-medium text-[#2e3338] transition-colors hover:border-[#0645ad] hover:text-[#0645ad]"
                        >
                          <Users size={13} /> Apply to clients
                        </button>
                        {isFirm ? (
                          <button
                            onClick={() => navigate('/templates/new')}
                            title="Clone to customize"
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#657381] transition-colors hover:text-[#0645ad]"
                          >
                            <Copy size={13} /> Clone
                          </button>
                        ) : (
                          <Link
                            to={`/templates/${t.id}`}
                            title="Edit template"
                            className="inline-flex items-center rounded-lg p-1.5 text-[#9aa5b1] transition-colors hover:text-[#0645ad]"
                          >
                            <ChevronRight size={18} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#9aa5b1]">
                    No templates match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {applyTemplate && (
        <ApplyToClientsDialog template={applyTemplate} onClose={() => setApplyTemplate(null)} />
      )}
    </div>
  );
}
