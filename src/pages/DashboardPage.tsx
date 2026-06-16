import { Link } from 'react-router';
import {
  FileText,
  Scale,
  TrendingUp,
  PieChart,
  Activity,
  Layers,
  ArrowLeftRight,
  Landmark,
  Download,
  FilePlus2,
  Sparkles,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/format';
import { categories, reports, reportsByCategory, getReport } from '@/data/reportCatalog';
import { household, totalMarketValue } from '@/data/clients';
import { savedTemplates, generatedReports } from '@/data/templates';
import type { ReportCategoryId } from '@/data/types';

const categoryStyle: Record<ReportCategoryId, { color: string; icon: LucideIcon }> = {
  summary: { color: '#0645ad', icon: FileText },
  'net-worth': { color: '#2f9e6e', icon: Scale },
  performance: { color: '#6c5ce7', icon: TrendingUp },
  exposure: { color: '#e0a106', icon: PieChart },
  activity: { color: '#0ea5b5', icon: Activity },
  holdings: { color: '#4f46e5', icon: Layers },
  transactions: { color: '#475569', icon: ArrowLeftRight },
  tax: { color: '#d4183d', icon: Landmark },
};

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-[#e9ecef] rounded-xl px-5 py-4">
      <p className="text-[11px] font-semibold text-[#9aa5b1] uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-semibold text-[#2e3338] mt-1.5 leading-none">{value}</p>
      {sub && <p className="text-xs text-[#657381] mt-1.5">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const now = new Date();
  const generatedThisMonth = generatedReports.filter((r) => {
    const d = new Date(r.generatedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const recent = [...generatedReports]
    .sort((a, b) => +new Date(b.generatedAt) - +new Date(a.generatedAt))
    .slice(0, 6);

  return (
    <div className="max-w-[1180px] mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#2e3338]">Reporting</h1>
          <p className="text-sm text-[#657381] mt-0.5">
            {household.name} · {household.accounts.length} accounts · Advisor {household.advisor}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/templates/new"
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-[#e9ecef] text-[#2e3338] bg-white hover:bg-gray-50 transition-colors"
          >
            <FilePlus2 size={15} /> New template
          </Link>
          <Link
            to="/generate"
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-[#0645ad] text-white hover:bg-[#053a8f] transition-colors"
          >
            <Sparkles size={15} /> Generate report
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Report types" value={String(reports.length)} sub={`${categories.length} categories`} />
        <MetricCard label="Saved templates" value={String(savedTemplates.length)} sub="Ready to generate" />
        <MetricCard label="Generated this month" value={String(generatedThisMonth)} sub={`${generatedReports.length} all time`} />
        <MetricCard label="Household AUM" value={formatCurrency(totalMarketValue)} sub="As of today, CAD" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent reports */}
        <div className="lg:col-span-2 bg-white border border-[#e9ecef] rounded-xl">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0f2f4]">
            <h2 className="text-sm font-semibold text-[#2e3338]">Recent reports</h2>
            <Link to="/library" className="text-xs font-medium text-[#0645ad] hover:underline">
              Browse library
            </Link>
          </div>
          <div className="divide-y divide-[#f0f2f4]">
            {recent.map((r) => {
              const type = getReport(r.reportTypeId);
              return (
                <Link
                  key={r.id}
                  to={`/library/${r.reportTypeId}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#eef1f6] flex items-center justify-center shrink-0">
                    <FileText size={15} className="text-[#0645ad]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#2e3338] truncate">{r.title}</p>
                    <p className="text-xs text-[#657381] truncate">
                      {type?.name ?? r.reportTypeId} · {r.account}
                    </p>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-xs text-[#657381]">{formatDate(r.generatedAt)}</p>
                    <p className="text-[11px] text-[#9aa5b1]">{r.preparedBy}</p>
                  </div>
                  <Download size={15} className="text-[#9aa5b1] group-hover:text-[#0645ad] transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-[#e9ecef] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#2e3338] mb-3">Quick actions</h2>
          <div className="space-y-2">
            <Link
              to="/generate"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#e9ecef] hover:border-[#0645ad] hover:bg-[#f5f8fe] transition-colors group"
            >
              <Sparkles size={16} className="text-[#0645ad]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#2e3338]">Generate a report</p>
                <p className="text-xs text-[#657381]">Run any template on demand</p>
              </div>
              <ChevronRight size={15} className="text-[#9aa5b1] group-hover:text-[#0645ad]" />
            </Link>
            <Link
              to="/templates/new"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#e9ecef] hover:border-[#0645ad] hover:bg-[#f5f8fe] transition-colors group"
            >
              <FilePlus2 size={16} className="text-[#0645ad]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#2e3338]">New template</p>
                <p className="text-xs text-[#657381]">Configure sections & recipients</p>
              </div>
              <ChevronRight size={15} className="text-[#9aa5b1] group-hover:text-[#0645ad]" />
            </Link>
            <Link
              to="/templates"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#e9ecef] hover:border-[#0645ad] hover:bg-[#f5f8fe] transition-colors group"
            >
              <FileText size={16} className="text-[#0645ad]" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#2e3338]">Manage templates</p>
                <p className="text-xs text-[#657381]">{savedTemplates.length} saved</p>
              </div>
              <ChevronRight size={15} className="text-[#9aa5b1] group-hover:text-[#0645ad]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Categories */}
      <h2 className="text-sm font-semibold text-[#2e3338] mt-7 mb-3">Report categories</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const { color, icon: Icon } = categoryStyle[cat.id];
          const count = reportsByCategory(cat.id).length;
          return (
            <Link
              key={cat.id}
              to={`/library#${cat.id}`}
              className="bg-white border border-[#e9ecef] rounded-xl p-4 hover:shadow-sm hover:border-[#d7dde5] transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}14`, color }}
                >
                  <Icon size={18} />
                </div>
                <span className="text-[11px] font-semibold text-[#9aa5b1]">
                  {count} {count === 1 ? 'report' : 'reports'}
                </span>
              </div>
              <p className={cn('text-sm font-semibold text-[#2e3338] group-hover:text-[#0645ad] transition-colors')}>
                {cat.index}. {cat.name}
              </p>
              <p className="text-xs text-[#657381] mt-1 leading-relaxed line-clamp-2">{cat.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
