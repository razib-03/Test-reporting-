import { useState } from 'react';
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
  Search,
  BarChart3,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { categories, libraryReports, benchmarkSiblingOf } from '@/data/reportCatalog';
import type { ReportCategoryId, ReportType } from '@/data/types';
import ReportRenderer from '@/components/report/ReportRenderer';

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

function ReportCard({ report }: { report: ReportType }) {
  const { color } = categoryStyle[report.category];
  const [open, setOpen] = useState(false);
  const hasBenchmark = !!benchmarkSiblingOf(report.id);
  return (
    <div className="bg-white border border-[#e9ecef] rounded-xl p-4 hover:border-[#d7dde5] transition-all flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          to={`/library/${report.id}`}
          className="text-sm font-semibold text-[#2e3338] hover:text-[#0645ad] transition-colors leading-snug"
        >
          {report.name}
        </Link>
        {report.hasChart && (
          <span
            className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${color}14`, color }}
            title="Includes a chart"
          >
            <BarChart3 size={11} /> Chart
          </span>
        )}
      </div>
      <p className="text-xs text-[#657381] leading-relaxed line-clamp-3 flex-1">{report.howCreated}</p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0f2f4]">
        <span className="text-[11px] text-[#9aa5b1]">
          {report.variants.length} {report.variants.length === 1 ? 'variant' : 'variants'}
          {report.periodBased ? ' · period' : ' · point-in-time'}
          {hasBenchmark ? ' · benchmark optional' : ''}
        </span>
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0645ad] hover:underline"
        >
          {open ? (
            <>
              Hide <ChevronUp size={13} />
            </>
          ) : (
            <>
              Preview <ChevronDown size={13} />
            </>
          )}
        </button>
      </div>

      {open && (
        <div className="mt-3 border-t border-[#f0f2f4] pt-3">
          <div className="max-h-[380px] overflow-auto rounded-lg border border-[#eef1f4] bg-[#fcfcfd] p-3">
            <ReportRenderer report={report} />
          </div>
          <Link
            to={`/library/${report.id}`}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#0645ad] hover:underline"
          >
            Open full report <ChevronRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function LibraryPage() {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<ReportCategoryId | 'all'>('all');

  const q = query.trim().toLowerCase();
  const matches = (r: ReportType) =>
    (activeCat === 'all' || r.category === activeCat) &&
    (q === '' || r.name.toLowerCase().includes(q) || r.howCreated.toLowerCase().includes(q));

  const visibleCategories = categories.filter(
    (cat) => (activeCat === 'all' || cat.id === activeCat) && libraryReports.some((r) => r.category === cat.id && matches(r))
  );

  const totalMatches = libraryReports.filter(matches).length;

  return (
    <div className="max-w-[1180px] mx-auto px-6 py-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-[#2e3338]">Report library</h1>
        <p className="text-sm text-[#657381] mt-0.5">
          {libraryReports.length} report types across {categories.length} categories — expand any card to preview a sample.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa5b1]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reports…"
          className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-[#e9ecef] bg-white outline-none focus:border-[#0645ad] focus:ring-2 focus:ring-[#0645ad]/10 text-[#2e3338] placeholder:text-[#9aa5b1]"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCat('all')}
          className={cn(
            'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
            activeCat === 'all'
              ? 'bg-[#0645ad] text-white border-[#0645ad]'
              : 'bg-white text-[#657381] border-[#e9ecef] hover:border-[#0645ad] hover:text-[#0645ad]'
          )}
        >
          All ({libraryReports.length})
        </button>
        {categories.map((cat) => {
          const { color } = categoryStyle[cat.id];
          const active = activeCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                active ? 'text-white' : 'bg-white hover:opacity-80'
              )}
              style={
                active
                  ? { backgroundColor: color, borderColor: color }
                  : { color, borderColor: `${color}40`, backgroundColor: `${color}0d` }
              }
            >
              {cat.name.replace(' Reports', '')}
            </button>
          );
        })}
      </div>

      {/* Sections */}
      {visibleCategories.length === 0 ? (
        <div className="text-center py-16 text-sm text-[#9aa5b1]">No reports match “{query}”.</div>
      ) : (
        <div className="space-y-8">
          {visibleCategories.map((cat) => {
            const { color, icon: Icon } = categoryStyle[cat.id];
            const catReports = libraryReports.filter((r) => r.category === cat.id && matches(r));
            return (
              <section key={cat.id} id={cat.id} className="scroll-mt-20">
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}14`, color }}
                  >
                    <Icon size={15} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[#2e3338]">
                      Category {cat.index} — {cat.name}
                    </h2>
                    <p className="text-xs text-[#657381]">{cat.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                  {catReports.map((r) => (
                    <ReportCard key={r.id} report={r} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {q !== '' && totalMatches > 0 && (
        <p className="text-xs text-[#9aa5b1] mt-6">{totalMatches} matching report types.</p>
      )}
    </div>
  );
}
