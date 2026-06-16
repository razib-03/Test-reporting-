import { useState } from 'react';
import { Link } from 'react-router';
import { Plus, Search, FileText, ShieldCheck, ChevronRight } from 'lucide-react';
import { savedTemplates } from '@/data/templates';
import { getReport, getCategory } from '@/data/reportCatalog';
import { formatDate } from '@/lib/format';

export default function TemplatesPage() {
  const [query, setQuery] = useState('');

  const filtered = savedTemplates.filter((t) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const reportName = getReport(t.reportTypeId)?.name.toLowerCase() ?? '';
    return (
      t.title.toLowerCase().includes(q) ||
      t.accounts.toLowerCase().includes(q) ||
      reportName.includes(q)
    );
  });

  return (
    <div className="min-h-full bg-[#f8f9fa] px-6 py-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#2e3338]">Report Templates</h1>
            <p className="mt-1 text-sm text-[#657381]">
              Configure a template once, then generate the report on demand. Templates define the
              report type, sections, parameters, accounts and cover page.
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
                <th className="px-4 py-2.5">Accounts</th>
                <th className="px-4 py-2.5">Currency</th>
                <th className="px-4 py-2.5">Updated</th>
                <th className="px-4 py-2.5 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const report = getReport(t.reportTypeId);
                const category = report ? getCategory(report.category) : undefined;
                return (
                  <tr
                    key={t.id}
                    className="group border-b border-[#f0f2f4] last:border-0 hover:bg-[#f8f9fa]"
                  >
                    <td className="px-4 py-3">
                      <Link to={`/templates/${t.id}`} className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0645ad]">
                          <FileText size={15} />
                        </span>
                        <span className="flex flex-col">
                          <span className="font-medium text-[#2e3338] group-hover:text-[#0645ad]">
                            {t.title}
                          </span>
                          {t.documentVault && (
                            <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                              <ShieldCheck size={10} /> Document Vault
                            </span>
                          )}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[#2e3338]">{report?.name ?? '—'}</span>
                      {category && (
                        <span className="mt-0.5 block text-xs text-[#9aa5b1]">{category.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#657381]">{t.accounts}</td>
                    <td className="px-4 py-3 text-[#657381]">{t.reportingCurrency}</td>
                    <td className="px-4 py-3 text-[#657381]">{formatDate(t.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/templates/${t.id}`}
                        className="inline-flex items-center text-[#9aa5b1] transition-colors group-hover:text-[#0645ad]"
                      >
                        <ChevronRight size={18} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#9aa5b1]">
                    No templates match “{query}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
