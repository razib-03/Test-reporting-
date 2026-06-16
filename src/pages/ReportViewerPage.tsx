import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Download, FileText, Info, Calendar, Layers } from 'lucide-react';
import { getReport, getCategory } from '@/data/reportCatalog';
import { cn } from '@/lib/utils';
import ReportShell from '@/components/report/ReportShell';
import ReportRenderer from '@/components/report/ReportRenderer';

const AS_OF = '2026-06-13';

export default function ReportViewerPage() {
  const { reportId } = useParams();
  const report = reportId ? getReport(reportId) : undefined;
  const [variant, setVariant] = useState(0);

  if (!report) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <FileText className="mx-auto mb-4 text-[#cbd2d9]" size={40} />
        <h2 className="text-lg font-semibold text-[#2e3338]">Report not found</h2>
        <p className="mt-1 text-sm text-[#657381]">We couldn’t find a report with that ID.</p>
        <Link to="/library" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#0645ad] px-4 py-2 text-sm font-medium text-white hover:bg-[#053a8f]">
          <ArrowLeft size={15} /> Back to Report Library
        </Link>
      </div>
    );
  }

  const category = getCategory(report.category);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <Link to="/library" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0645ad] hover:underline">
        <ArrowLeft size={15} /> Report Library
      </Link>

      {/* Title row */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9aa5b1]">
            {category && `Category ${category.index} · ${category.name}`}
          </div>
          <h1 className="mt-0.5 text-2xl font-semibold text-[#2e3338]">{report.name}</h1>
        </div>
        <button
          onClick={() => console.log('Generate & Download', report.id, { variant: report.variants[variant], asOf: AS_OF })}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0645ad] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#053a8f]"
        >
          <Download size={16} /> Generate &amp; Download
        </button>
      </div>

      {/* Metadata panel */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[#e9ecef] bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#657381]">
            <Info size={14} /> How it’s created
          </div>
          <p className="text-sm leading-relaxed text-[#2e3338]">{report.howCreated}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#eef3fb] px-2.5 py-1 text-[11px] font-medium text-[#0645ad]">
            <Calendar size={12} /> {report.periodBased ? 'Period-based' : 'Point-in-time'}
          </div>
        </div>

        <div className="rounded-xl border border-[#e9ecef] bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#657381]">
            <Layers size={14} /> Data required
          </div>
          <div className="flex flex-wrap gap-1.5">
            {report.dataRequired.map((d) => (
              <span key={d} className="rounded-md bg-[#f3f4f6] px-2 py-1 text-[12px] text-[#2e3338]">{d}</span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#e9ecef] bg-white p-4">
          <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#657381]">Output</div>
          <p className="text-[13px] leading-relaxed text-[#657381]">{report.output}</p>
        </div>
      </div>

      {/* Variants */}
      {report.variants.length > 1 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-medium text-[#657381]">Variant:</span>
          {report.variants.map((v, i) => (
            <button
              key={v}
              onClick={() => setVariant(i)}
              className={cn(
                'rounded-full border px-3 py-1 text-[13px] font-medium transition-colors',
                variant === i
                  ? 'border-[#0645ad] bg-[#0645ad] text-white'
                  : 'border-[#e9ecef] bg-white text-[#657381] hover:border-[#0645ad] hover:text-[#0645ad]'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      {/* Rendered report */}
      <div className="mt-5">
        <ReportShell title={report.name} asOfDate={AS_OF}>
          <ReportRenderer report={report} />
        </ReportShell>
      </div>
    </div>
  );
}
