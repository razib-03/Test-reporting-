import type { ReactNode } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import type { ReportType } from '@/data/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber, formatSignedPercent, formatDate, signClass } from '@/lib/format';
import { household } from '@/data/clients';
import {
  cumulativeReturnSeries, monthlyReturnsByYear, summaryStats, marketValueVsInvestment,
  calendarYears, returnRows, portfolioReturnRow, benchmarkReturnRow, differenceReturnRow,
  assetAllocation, exposureDimensions, evolutionSeries, holdings, privateEquity,
  transactions, realizedGains, accountFlows, netWorthSections, netWorthTotals, insuranceRows,
  crm2Charges, crm2TotalCompensation, crm2Performance, crm2Activity, consolidatedActivity,
  guidelines, foreignProperty,
} from '@/data/sampleReports';

const CURRENCY = 'CAD';
const CHART = ['#0645ad', '#2f9e6e', '#e0a106', '#6c5ce7', '#0ea5b5', '#d4183d'];

// ── shared table primitives ───────────────────────────────────────────────
function Th({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' | 'center' }) {
  return (
    <th className={cn('px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#657381]', align === 'right' && 'text-right', align === 'center' && 'text-center', align === 'left' && 'text-left')}>
      {children}
    </th>
  );
}
function Td({ children, align = 'left', className }: { children: ReactNode; align?: 'left' | 'right' | 'center'; className?: string }) {
  return (
    <td className={cn('px-3 py-2 text-sm text-[#2e3338]', align === 'right' && 'text-right tabular-nums', align === 'center' && 'text-center', className)}>
      {children}
    </td>
  );
}
function SectionLabel({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 text-sm font-semibold text-[#2e3338]">{children}</h3>;
}
function ChartCard({ title, children, height = 260 }: { title?: string; children: ReactNode; height?: number }) {
  return (
    <div className="rounded-lg border border-[#e9ecef] bg-white p-4">
      {title && <div className="mb-2 text-[12px] font-semibold text-[#657381]">{title}</div>}
      <div style={{ width: '100%', height }}>{children}</div>
    </div>
  );
}
const tooltipStyle = { fontSize: 12, borderRadius: 8, border: '1px solid #e9ecef' };

// ════════════════════════════════════════════════════════════════════════
export default function ReportRenderer({ report }: { report: ReportType }) {
  switch (report.layout) {
    case 'table': return <TableReport report={report} />;
    case 'flows-table': return <FlowsReport />;
    case 'balance-sheet': return <NetWorthReport estate={false} />;
    case 'line-and-table': return <PortfolioOverviewReport />;
    case 'returns-grid': return <ReturnsGrid report={report} />;
    case 'pie-and-table': return <AllocationReport />;
    case 'guidelines': return <GuidelinesReport showChart={report.hasChart} />;
    case 'stacked-evolution': return <EvolutionReport />;
    case 'multi-pie': return <ExposuresReport />;
    case 'multi-section': return report.id === 'crm2' ? <CRM2Report /> : <ConsolidatedActivityReport />;
    case 'transactions': return <TransactionsReport report={report} />;
    default: return null;
  }
}

// ── TABLE: account-details / valuation / portfolio-valuation / private-equity
function TableReport({ report }: { report: ReportType }) {
  if (report.id === 'private-equity') return <PrivateEquityTable />;
  if (report.id === 'account-details' || report.id === 'account-details-period-change') {
    return <AccountDetailsTable withPeriodChange={report.id === 'account-details-period-change'} />;
  }
  // portfolio-valuation (full) or valuation (simple)
  const full = report.id === 'portfolio-valuation';
  const classes = [...new Set(holdings.map((h) => h.assetClass))];
  let grandMV = 0, grandBook = 0, grandUGL = 0;
  return (
    <div>
      <SectionLabel>Holdings by Asset Class</SectionLabel>
      <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
        <table className="w-full border-collapse">
          <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
            <tr>
              <Th>Security</Th>
              <Th align="right">Quantity</Th>
              {full && <Th align="right">Unit Cost</Th>}
              <Th align="right">Price</Th>
              {full && <Th align="right">Book Value</Th>}
              <Th align="right">Market Value</Th>
              {full && <Th align="right">Unrealized G/L</Th>}
              {full && <Th align="right">G/L %</Th>}
              <Th align="right">% Port</Th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => {
              const rows = holdings.filter((h) => h.assetClass === cls);
              const mv = rows.reduce((s, r) => s + r.marketValue, 0);
              const book = rows.reduce((s, r) => s + r.bookValue, 0);
              const ugl = rows.reduce((s, r) => s + r.unrealizedGL, 0);
              const pctp = rows.reduce((s, r) => s + r.pctPortfolio, 0);
              grandMV += mv; grandBook += book; grandUGL += ugl;
              return (
                <tbody key={cls} className="contents">
                  <tr className="border-b border-[#f0f2f4] bg-[#f8f9fa]/60">
                    <Td className="font-semibold">{cls}</Td>
                    <td colSpan={full ? 8 : 4} />
                  </tr>
                  {rows.map((h) => (
                    <tr key={h.symbol} className="border-b border-[#f0f2f4]">
                      <Td>
                        <span className="font-medium">{h.security}</span>
                        <span className="ml-2 text-xs text-[#9aa5b1]">{h.symbol}</span>
                      </Td>
                      <Td align="right">{formatNumber(h.quantity)}</Td>
                      {full && <Td align="right">{formatCurrency(h.unitCost, CURRENCY, { decimals: 2 })}</Td>}
                      <Td align="right">{formatCurrency(h.price, CURRENCY, { decimals: 2 })}</Td>
                      {full && <Td align="right">{formatCurrency(h.bookValue)}</Td>}
                      <Td align="right">{formatCurrency(h.marketValue)}</Td>
                      {full && <Td align="right" className={signClass(h.unrealizedGL)}>{formatCurrency(h.unrealizedGL)}</Td>}
                      {full && <Td align="right" className={signClass(h.unrealizedGL)}>{formatSignedPercent(h.unrealizedPct, 1)}</Td>}
                      <Td align="right">{h.pctPortfolio.toFixed(1)}%</Td>
                    </tr>
                  ))}
                  <tr className="border-b border-[#e9ecef] bg-[#f8f9fa] font-semibold">
                    <Td className="font-semibold">{cls} Subtotal</Td>
                    <td />
                    {full && <td />}
                    <td />
                    {full && <Td align="right">{formatCurrency(book)}</Td>}
                    <Td align="right">{formatCurrency(mv)}</Td>
                    {full && <Td align="right" className={signClass(ugl)}>{formatCurrency(ugl)}</Td>}
                    {full && <td />}
                    <Td align="right">{pctp.toFixed(1)}%</Td>
                  </tr>
                </tbody>
              );
            })}
            <tr className="border-t-2 border-[#0645ad] bg-[#eef3fb] font-semibold text-[#0645ad]">
              <Td className="font-semibold text-[#0645ad]">Grand Total</Td>
              <td />
              {full && <td />}
              <td />
              {full && <Td align="right">{formatCurrency(grandBook)}</Td>}
              <Td align="right">{formatCurrency(grandMV)}</Td>
              {full && <Td align="right">{formatCurrency(grandUGL)}</Td>}
              {full && <td />}
              <Td align="right">100.0%</Td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccountDetailsTable({ withPeriodChange }: { withPeriodChange: boolean }) {
  const members = household.members;
  let grand = 0, grandPrior = 0;
  return (
    <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
      <table className="w-full border-collapse">
        <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
          <tr>
            <Th>Account</Th>
            <Th>Account ID</Th>
            <Th>Type</Th>
            <Th align="center">Currency</Th>
            <Th align="right">Inception</Th>
            {withPeriodChange && <Th align="right">MV (Prior)</Th>}
            <Th align="right">Market Value</Th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const accts = household.accounts.filter((a) => a.owner === m.name);
            if (!accts.length) return null;
            const sub = accts.reduce((s, a) => s + a.marketValue, 0);
            const subPrior = accts.reduce((s, a) => s + a.priorMarketValue, 0);
            grand += sub; grandPrior += subPrior;
            return (
              <tbody key={m.name} className="contents">
                <tr className="border-b border-[#f0f2f4] bg-[#f8f9fa]/60">
                  <Td className="font-semibold">{m.name}</Td>
                  <td colSpan={withPeriodChange ? 6 : 5} />
                </tr>
                {accts.map((a) => (
                  <tr key={a.id} className="border-b border-[#f0f2f4]">
                    <Td>{a.name}</Td>
                    <Td>{a.id}</Td>
                    <Td>{a.type}</Td>
                    <Td align="center">{a.currency}</Td>
                    <Td align="right">{formatDate(a.inceptionDate)}</Td>
                    {withPeriodChange && <Td align="right">{formatCurrency(a.priorMarketValue)}</Td>}
                    <Td align="right">{formatCurrency(a.marketValue)}</Td>
                  </tr>
                ))}
                <tr className="border-b border-[#e9ecef] bg-[#f8f9fa] font-semibold">
                  <Td className="font-semibold">{m.name} Subtotal</Td>
                  <td colSpan={4} />
                  {withPeriodChange && <Td align="right">{formatCurrency(subPrior)}</Td>}
                  <Td align="right">{formatCurrency(sub)}</Td>
                </tr>
              </tbody>
            );
          })}
          <tr className="border-t-2 border-[#0645ad] bg-[#eef3fb] font-semibold text-[#0645ad]">
            <Td className="font-semibold text-[#0645ad]">Household Total</Td>
            <td colSpan={4} />
            {withPeriodChange && <Td align="right">{formatCurrency(grandPrior)}</Td>}
            <Td align="right">{formatCurrency(grand)}</Td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PrivateEquityTable() {
  const currencies = [...new Set(privateEquity.map((p) => p.currency))];
  return (
    <div>
      <SectionLabel>Private Investments</SectionLabel>
      <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
        <table className="w-full border-collapse">
          <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
            <tr>
              <Th>Fund</Th>
              <Th align="right">Commitment</Th>
              <Th align="right">Paid-In</Th>
              <Th align="right">Distribution</Th>
              <Th align="right">Residual Value</Th>
              <Th align="right">DPI</Th>
              <Th align="right">TVPI</Th>
              <Th align="right">IRR</Th>
            </tr>
          </thead>
          <tbody>
            {currencies.map((ccy) => {
              const rows = privateEquity.filter((p) => p.currency === ccy);
              return (
                <tbody key={ccy} className="contents">
                  <tr className="border-b border-[#f0f2f4] bg-[#f8f9fa]/60">
                    <Td className="font-semibold">{ccy} Denominated</Td>
                    <td colSpan={7} />
                  </tr>
                  {rows.map((p) => (
                    <tr key={p.fund} className="border-b border-[#f0f2f4]">
                      <Td className="font-medium">{p.fund}</Td>
                      <Td align="right">{formatCurrency(p.commitment)}</Td>
                      <Td align="right">{formatCurrency(p.paidIn)}</Td>
                      <Td align="right">{formatCurrency(p.distribution)}</Td>
                      <Td align="right">{formatCurrency(p.residualValue)}</Td>
                      <Td align="right">{p.dpi.toFixed(2)}x</Td>
                      <Td align="right">{p.tvpi.toFixed(2)}x</Td>
                      <Td align="right" className={signClass(p.irr)}>{p.irr.toFixed(1)}%</Td>
                    </tr>
                  ))}
                </tbody>
              );
            })}
            <tr className="border-t-2 border-[#0645ad] bg-[#eef3fb] font-semibold text-[#0645ad]">
              <Td className="font-semibold text-[#0645ad]">Grand Total ({CURRENCY})</Td>
              <Td align="right">{formatCurrency(privateEquity.reduce((s, p) => s + p.commitment, 0))}</Td>
              <Td align="right">{formatCurrency(privateEquity.reduce((s, p) => s + p.paidIn, 0))}</Td>
              <Td align="right">{formatCurrency(privateEquity.reduce((s, p) => s + p.distribution, 0))}</Td>
              <Td align="right">{formatCurrency(privateEquity.reduce((s, p) => s + p.residualValue, 0))}</Td>
              <td colSpan={3} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── FLOWS: account-overview / portfolio-reconciliation ────────────────────
function FlowsReport() {
  const t = accountFlows;
  const sum = (k: 'beginning' | 'inflows' | 'outflows' | 'gains' | 'ending') => t.reduce((s, r) => s + r[k], 0);
  return (
    <div>
      <SectionLabel>Portfolio Flows by Account</SectionLabel>
      <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
        <table className="w-full border-collapse">
          <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
            <tr>
              <Th>Account</Th>
              <Th align="right">Beginning</Th>
              <Th align="right">Inflows</Th>
              <Th align="right">Outflows</Th>
              <Th align="right">Investment Gain</Th>
              <Th align="right">Ending</Th>
              <Th align="right">TWR</Th>
              <Th align="right">% Port</Th>
            </tr>
          </thead>
          <tbody>
            {t.map((r) => (
              <tr key={r.id} className="border-b border-[#f0f2f4]">
                <Td>
                  <span className="font-medium">{r.name}</span>
                  <span className="ml-2 text-xs text-[#9aa5b1]">{r.type}</span>
                </Td>
                <Td align="right">{formatCurrency(r.beginning)}</Td>
                <Td align="right">{formatCurrency(r.inflows)}</Td>
                <Td align="right">{formatCurrency(r.outflows)}</Td>
                <Td align="right" className={signClass(r.gains)}>{formatCurrency(r.gains)}</Td>
                <Td align="right">{formatCurrency(r.ending)}</Td>
                <Td align="right" className={signClass(r.twr ?? 0)}>{formatSignedPercent(r.twr ?? 0, 1)}</Td>
                <Td align="right">{r.pctPortfolio.toFixed(1)}%</Td>
              </tr>
            ))}
            <tr className="border-t-2 border-[#0645ad] bg-[#eef3fb] font-semibold text-[#0645ad]">
              <Td className="font-semibold text-[#0645ad]">Total</Td>
              <Td align="right">{formatCurrency(sum('beginning'))}</Td>
              <Td align="right">{formatCurrency(sum('inflows'))}</Td>
              <Td align="right">{formatCurrency(sum('outflows'))}</Td>
              <Td align="right">{formatCurrency(sum('gains'))}</Td>
              <Td align="right">{formatCurrency(sum('ending'))}</Td>
              <Td align="right">{formatSignedPercent(portfolioReturnRow.trailing.qtd, 1)}</Td>
              <Td align="right">100.0%</Td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-[#9aa5b1]">Total Investment Gain and returns are net of fees and expenses.</p>
    </div>
  );
}

// ── NET WORTH balance sheet ───────────────────────────────────────────────
function NetWorthReport({ estate }: { estate: boolean }) {
  const memberKeys: Array<keyof typeof netWorthTotals> = ['daniel', 'amara', 'trust'];
  const labels = ['Daniel Okafor', 'Amara Okafor', 'Family Trust'];
  const rowTotal = (r: { daniel: number; amara: number; trust: number }) => r.daniel + r.amara + r.trust;
  return (
    <div>
      <SectionLabel>{estate ? 'Estate Value Statement' : 'Net Worth Statement'}</SectionLabel>
      <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
        <table className="w-full border-collapse">
          <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
            <tr>
              <Th>&nbsp;</Th>
              {labels.map((l) => <Th key={l} align="right">{l}</Th>)}
              <Th align="right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {netWorthSections.map((section) => (
              <tbody key={section.title} className="contents">
                <tr className="border-b border-[#f0f2f4] bg-[#f8f9fa]/60">
                  <Td className="font-semibold">{section.title}</Td>
                  <td colSpan={4} />
                </tr>
                {section.rows.map((r) => (
                  <tr key={r.label} className={cn('border-b border-[#f0f2f4]', r.isSubtotal && 'bg-[#f8f9fa] font-semibold')}>
                    <Td className={cn(r.indent && 'pl-6', r.isSubtotal && 'font-semibold')}>{r.label}</Td>
                    {memberKeys.map((k) => <Td key={k} align="right" className={signClass(r[k as 'daniel' | 'amara' | 'trust'])}>{formatCurrency(r[k as 'daniel' | 'amara' | 'trust'])}</Td>)}
                    <Td align="right" className={cn(signClass(rowTotal(r)), r.isSubtotal && 'font-semibold')}>{formatCurrency(rowTotal(r))}</Td>
                  </tr>
                ))}
              </tbody>
            ))}
            {estate && (
              <tbody className="contents">
                <tr className="border-b border-[#f0f2f4] bg-[#f8f9fa]/60">
                  <Td className="font-semibold">Insurance</Td>
                  <td colSpan={4} />
                </tr>
                {insuranceRows.map((r) => (
                  <tr key={r.label} className="border-b border-[#f0f2f4]">
                    <Td className="pl-6">{r.label}</Td>
                    {memberKeys.map((k) => <Td key={k} align="right">{formatCurrency(r[k as 'daniel' | 'amara' | 'trust'])}</Td>)}
                    <Td align="right">{formatCurrency(rowTotal(r))}</Td>
                  </tr>
                ))}
              </tbody>
            )}
            <tr className="border-t-2 border-[#0645ad] bg-[#eef3fb] font-semibold text-[#0645ad]">
              <Td className="font-semibold text-[#0645ad]">Net Worth</Td>
              {memberKeys.map((k) => <Td key={k} align="right" className="text-[#0645ad]">{formatCurrency(netWorthTotals[k])}</Td>)}
              <Td align="right" className="text-[#0645ad]">{formatCurrency(netWorthTotals.daniel + netWorthTotals.amara + netWorthTotals.trust)}</Td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── PORTFOLIO OVERVIEW: line + trailing table ─────────────────────────────
function PortfolioOverviewReport() {
  const rows = [
    { period: 'QTD', beginning: 5_372_400, inflows: 31_500, outflows: -40_000, gain: 183_190, ending: 5_547_090, twr: 3.3, mwr: 3.2 },
    { period: 'YTD', beginning: 5_244_700, inflows: 87_500, outflows: -130_000, gain: 344_890, ending: 5_547_090, twr: 5.6, mwr: 5.5 },
    { period: '1 Year', beginning: 4_980_300, inflows: 150_000, outflows: -220_000, gain: 636_790, ending: 5_547_090, twr: 11.9, mwr: 11.7 },
    { period: '3 Year', beginning: 4_410_000, inflows: 540_000, outflows: -610_000, gain: 1_207_090, ending: 5_547_090, twr: 5.2, mwr: 5.0 },
    { period: '5 Year', beginning: 3_620_000, inflows: 980_000, outflows: -870_000, gain: 1_817_090, ending: 5_547_090, twr: 7.8, mwr: 7.6 },
    { period: 'Since Inception', beginning: 0, inflows: 3_640_000, outflows: -1_180_000, gain: 3_087_090, ending: 5_547_090, twr: 8.4, mwr: 8.2 },
  ];
  return (
    <div className="space-y-6">
      <ChartCard title="Market Value vs. Net Investment">
        <ResponsiveContainer>
          <LineChart data={marketValueVsInvestment} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f4" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#657381' }} />
            <YAxis tick={{ fontSize: 11, fill: '#657381' }} tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="marketValue" name="Market Value" stroke={CHART[0]} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="netInvestment" name="Net Investment" stroke={CHART[2]} strokeWidth={2} strokeDasharray="5 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <div>
        <SectionLabel>Trailing Returns &amp; Activity</SectionLabel>
        <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
          <table className="w-full border-collapse">
            <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
              <tr>
                <Th>Period</Th>
                <Th align="right">Beginning</Th>
                <Th align="right">Inflows</Th>
                <Th align="right">Outflows</Th>
                <Th align="right">Investment Gain</Th>
                <Th align="right">Ending</Th>
                <Th align="right">TWR</Th>
                <Th align="right">MWR</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.period} className="border-b border-[#f0f2f4]">
                  <Td className="font-medium">{r.period}</Td>
                  <Td align="right">{formatCurrency(r.beginning)}</Td>
                  <Td align="right">{formatCurrency(r.inflows)}</Td>
                  <Td align="right">{formatCurrency(r.outflows)}</Td>
                  <Td align="right" className={signClass(r.gain)}>{formatCurrency(r.gain)}</Td>
                  <Td align="right">{formatCurrency(r.ending)}</Td>
                  <Td align="right" className={signClass(r.twr)}>{formatSignedPercent(r.twr, 1)}</Td>
                  <Td align="right" className={signClass(r.mwr)}>{formatSignedPercent(r.mwr, 1)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-[#9aa5b1]">Returns for periods greater than 12 months are annualized.</p>
      </div>
    </div>
  );
}

// ── RETURNS GRID: cumulative / calendar / trailing / foreign-property ─────
function ReturnsGrid({ report }: { report: ReportType }) {
  if (report.id === 'cumulative-returns') return <CumulativeReturns />;
  if (report.id === 'foreign-property') return <ForeignPropertyReport />;
  const trailing = report.id.startsWith('trailing');
  const withBenchmarks = report.id.includes('benchmarks');
  return trailing
    ? <TrailingReturns withBenchmarks={withBenchmarks} />
    : <CalendarReturns withBenchmarks={withBenchmarks} />;
}

function CumulativeReturns() {
  const stats = summaryStats;
  const statItems = [
    { label: 'Return (Cumulative)', value: formatSignedPercent(stats.returnCumulative, 1) },
    { label: 'Return (Annualized)', value: formatSignedPercent(stats.returnAnnualized, 2) },
    { label: 'Volatility (Annualized)', value: `${stats.volatilityAnnualized.toFixed(2)}%` },
    { label: 'Sharpe Ratio', value: stats.sharpeRatio.toFixed(2) },
    { label: '% Positive Months', value: `${stats.positiveMonths.toFixed(0)}%` },
    { label: '% Negative Months', value: `${stats.negativeMonths.toFixed(0)}%` },
    { label: 'Max Drawdown', value: `${stats.maxDrawdown.toFixed(1)}%` },
  ];
  const sampled = cumulativeReturnSeries.filter((_, i) => i % 3 === 0);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return (
    <div className="space-y-6">
      <ChartCard title="Cumulative Time-Weighted Return Since Inception">
        <ResponsiveContainer>
          <LineChart data={sampled} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f4" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#657381' }} interval={11} />
            <YAxis tick={{ fontSize: 11, fill: '#657381' }} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
            <Line type="monotone" dataKey="value" name="Cumulative TWR" stroke={CHART[0]} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div>
        <SectionLabel>Summary Statistics</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {statItems.map((s) => (
            <div key={s.label} className="rounded-lg border border-[#e9ecef] bg-[#f8f9fa] px-3 py-3">
              <div className="text-[10px] font-medium uppercase tracking-wide text-[#9aa5b1]">{s.label}</div>
              <div className="mt-1 text-base font-semibold text-[#2e3338]">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Monthly Net Returns by Calendar Year</SectionLabel>
        <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
          <table className="w-full border-collapse">
            <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
              <tr>
                <Th>Year</Th>
                {months.map((m) => <Th key={m} align="right">{m}</Th>)}
                <Th align="right">Total</Th>
                <Th align="right">Cumul.</Th>
              </tr>
            </thead>
            <tbody>
              {monthlyReturnsByYear.map((row) => (
                <tr key={row.year} className="border-b border-[#f0f2f4]">
                  <Td className="font-medium">{row.year}</Td>
                  {row.months.map((v, i) => (
                    <Td key={i} align="right" className={v === null ? 'text-[#cbd2d9]' : signClass(v)}>
                      {v === null ? '—' : v.toFixed(1)}
                    </Td>
                  ))}
                  <Td align="right" className={cn('font-semibold', row.total === null ? 'text-[#cbd2d9]' : signClass(row.total))}>
                    {row.total === null ? '—' : formatSignedPercent(row.total, 1)}
                  </Td>
                  <Td align="right" className="font-semibold">{row.cumulative.toFixed(0)}%</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReturnsTableRow({ row, cols }: { row: typeof returnRows[number]; cols: number[] }) {
  const isSpecial = row.kind === 'benchmark' || row.kind === 'difference' || row.kind === 'total';
  return (
    <tr className={cn('border-b border-[#f0f2f4]',
      row.kind === 'total' && 'bg-[#eef3fb] font-semibold text-[#0645ad]',
      row.kind === 'benchmark' && 'text-[#657381] italic',
      row.kind === 'difference' && 'text-[#657381]')}>
      <Td className={cn(isSpecial ? 'font-medium' : 'font-medium', row.kind === 'total' && 'text-[#0645ad]')}>{row.name}</Td>
      {!isSpecial && <Td align="right">{formatCurrency(row.marketValue)}</Td>}
      {!isSpecial && <Td align="right">{row.pctPortfolio.toFixed(1)}%</Td>}
      {isSpecial && <td />}
      {isSpecial && <td />}
      {cols.map((v, i) => <Td key={i} align="right" className={signClass(v)}>{formatSignedPercent(v, 1)}</Td>)}
    </tr>
  );
}

function CalendarReturns({ withBenchmarks }: { withBenchmarks: boolean }) {
  return (
    <div>
      <SectionLabel>Calendar-Year Returns by Asset Class</SectionLabel>
      <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
        <table className="w-full border-collapse">
          <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
            <tr>
              <Th>Holding / Group</Th>
              <Th align="right">Market Value</Th>
              <Th align="right">% Port</Th>
              {calendarYears.map((y, i) => <Th key={y} align="right">{i === calendarYears.length - 1 ? `${y} YTD` : y}</Th>)}
            </tr>
          </thead>
          <tbody>
            {returnRows.map((r) => <ReturnsTableRow key={r.name} row={r} cols={r.calendar} />)}
            <ReturnsTableRow row={portfolioReturnRow} cols={portfolioReturnRow.calendar} />
            {withBenchmarks && <ReturnsTableRow row={benchmarkReturnRow} cols={benchmarkReturnRow.calendar} />}
            {withBenchmarks && <ReturnsTableRow row={differenceReturnRow} cols={differenceReturnRow.calendar} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrailingReturns({ withBenchmarks }: { withBenchmarks: boolean }) {
  const periods = ['MTD', 'QTD', 'YTD', '1Y', '2Y', '3Y', '4Y', '5Y', '7Y', '10Y', 'SI'] as const;
  const keys = ['mtd', 'qtd', 'ytd', 'y1', 'y2', 'y3', 'y4', 'y5', 'y7', 'y10', 'si'] as const;
  const toCols = (t: typeof returnRows[number]['trailing']) => keys.map((k) => t[k]);
  return (
    <div>
      <SectionLabel>Trailing Returns by Asset Class</SectionLabel>
      <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
        <table className="w-full border-collapse">
          <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
            <tr>
              <Th>Holding / Group</Th>
              <Th align="right">Market Value</Th>
              <Th align="right">% Port</Th>
              {periods.map((p) => <Th key={p} align="right">{p}</Th>)}
            </tr>
          </thead>
          <tbody>
            {returnRows.map((r) => <ReturnsTableRow key={r.name} row={r} cols={toCols(r.trailing)} />)}
            <ReturnsTableRow row={portfolioReturnRow} cols={toCols(portfolioReturnRow.trailing)} />
            {withBenchmarks && <ReturnsTableRow row={benchmarkReturnRow} cols={toCols(benchmarkReturnRow.trailing)} />}
            {withBenchmarks && <ReturnsTableRow row={differenceReturnRow} cols={toCols(differenceReturnRow.trailing)} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ForeignPropertyReport() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const countries = [...new Set(foreignProperty.map((f) => f.country))];
  return (
    <div>
      <SectionLabel>Foreign Property — Month-End Book Values (T1135)</SectionLabel>
      <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
        <table className="w-full border-collapse">
          <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
            <tr>
              <Th>Security</Th>
              {months.map((m) => <Th key={m} align="right">{m}</Th>)}
              <Th align="right">Income</Th>
              <Th align="right">Max Book</Th>
              <Th align="right">Year-End</Th>
            </tr>
          </thead>
          <tbody>
            {countries.map((country) => (
              <tbody key={country} className="contents">
                <tr className="border-b border-[#f0f2f4] bg-[#f8f9fa]/60">
                  <Td className="font-semibold">{country}</Td>
                  <td colSpan={15} />
                </tr>
                {foreignProperty.filter((f) => f.country === country).map((f) => (
                  <tr key={f.symbol} className="border-b border-[#f0f2f4]">
                    <Td><span className="font-medium">{f.security}</span><span className="ml-2 text-xs text-[#9aa5b1]">{f.symbol}</span></Td>
                    {f.monthly.map((v, i) => <Td key={i} align="right" className="text-xs">{formatNumber(v / 1000)}k</Td>)}
                    <Td align="right">{formatCurrency(f.income)}</Td>
                    <Td align="right">{formatCurrency(f.maxBook)}</Td>
                    <Td align="right">{formatCurrency(f.yearEnd)}</Td>
                  </tr>
                ))}
              </tbody>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-[#9aa5b1]">Values support T1135 Foreign Income Verification Statement filing. Non-registered accounts only.</p>
    </div>
  );
}

// ── ALLOCATION: pie + table ───────────────────────────────────────────────
function AllocationReport() {
  const pieData = assetAllocation.map((g) => ({ name: g.name, value: g.marketValue, color: g.color }));
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Allocation by Asset Class">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={1}>
              {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <div>
        <SectionLabel>Allocation Summary</SectionLabel>
        <div className="overflow-hidden rounded-lg border border-[#e9ecef]">
          <table className="w-full border-collapse">
            <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
              <tr><Th>Asset Class</Th><Th align="right">Market Value</Th><Th align="right">% Port</Th></tr>
            </thead>
            <tbody>
              {assetAllocation.map((g) => (
                <tbody key={g.name} className="contents">
                  <tr className="border-b border-[#f0f2f4]">
                    <Td><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: g.color }} /><span className="font-medium">{g.name}</span></Td>
                    <Td align="right" className="font-medium">{formatCurrency(g.marketValue)}</Td>
                    <Td align="right" className="font-medium">{g.pct.toFixed(1)}%</Td>
                  </tr>
                  {g.subs.map((s) => (
                    <tr key={s.name} className="border-b border-[#f0f2f4]">
                      <Td className="pl-8 text-[#657381]">{s.name}</Td>
                      <Td align="right" className="text-[#657381]">{formatCurrency(s.marketValue)}</Td>
                      <Td align="right" className="text-[#657381]">{s.pct.toFixed(1)}%</Td>
                    </tr>
                  ))}
                </tbody>
              ))}
              <tr className="border-t-2 border-[#0645ad] bg-[#eef3fb] font-semibold text-[#0645ad]">
                <Td className="font-semibold text-[#0645ad]">Total</Td>
                <Td align="right">{formatCurrency(assetAllocation.reduce((s, g) => s + g.marketValue, 0))}</Td>
                <Td align="right">100.0%</Td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── EXPOSURES: multiple grouping dimensions ───────────────────────────────
function ExposuresReport() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {exposureDimensions.map((dim) => (
        <div key={dim.dimension} className="rounded-lg border border-[#e9ecef] p-4">
          <div className="mb-2 text-[12px] font-semibold text-[#657381]">{dim.dimension}</div>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={dim.slices} dataKey="marketValue" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {dim.slices.map((s) => <Cell key={s.name} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <table className="mt-2 w-full border-collapse">
            <tbody>
              {dim.slices.map((s) => (
                <tr key={s.name} className="border-b border-[#f0f2f4] last:border-0">
                  <Td><span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ background: s.color }} />{s.name}</Td>
                  <Td align="right" className="text-[#657381]">{formatCurrency(s.marketValue)}</Td>
                  <Td align="right" className="font-medium">{s.pct.toFixed(1)}%</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ── GUIDELINES: actual vs target/min/max ──────────────────────────────────
function GuidelinesReport({ showChart }: { showChart: boolean }) {
  const chartData = guidelines.map((g) => ({ name: g.name, Current: g.current, Target: g.target, range: g.max - g.min, min: g.min }));
  return (
    <div className="space-y-6">
      <div>
        <SectionLabel>Asset Allocation vs. Investment Policy — Okafor Family Trust</SectionLabel>
        <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
          <table className="w-full border-collapse">
            <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
              <tr>
                <Th>Asset Class</Th>
                <Th align="right">Market Value</Th>
                <Th align="right">Current %</Th>
                <Th align="right">Target %</Th>
                <Th align="right">Min %</Th>
                <Th align="right">Max %</Th>
                <Th align="center">Status</Th>
              </tr>
            </thead>
            <tbody>
              {guidelines.map((g) => {
                const inRange = g.current >= g.min && g.current <= g.max;
                return (
                  <tr key={g.name} className="border-b border-[#f0f2f4]">
                    <Td className="font-medium">{g.name}</Td>
                    <Td align="right">{formatCurrency(g.marketValue)}</Td>
                    <Td align="right" className="font-semibold">{g.current.toFixed(1)}%</Td>
                    <Td align="right">{g.target.toFixed(1)}%</Td>
                    <Td align="right" className="text-[#657381]">{g.min.toFixed(0)}%</Td>
                    <Td align="right" className="text-[#657381]">{g.max.toFixed(0)}%</Td>
                    <Td align="center">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium',
                        inRange ? 'bg-[#e7f6ee] text-[#2f9e6e]' : 'bg-[#fdeaee] text-[#d4183d]')}>
                        {inRange ? 'In Range' : 'Breach'}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {showChart && (
        <ChartCard title="Current vs. Target Allocation" height={280}>
          <ResponsiveContainer>
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f4" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#657381' }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#657381' }} width={110} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Target" fill={CHART[0]} radius={[0, 4, 4, 0]} barSize={10} />
              <Bar dataKey="Current" fill={CHART[1]} radius={[0, 4, 4, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}

// ── EVOLUTION: stacked bars over time ─────────────────────────────────────
function EvolutionReport() {
  const keys: Array<keyof typeof evolutionSeries[number]> = ['Cash', 'Fixed Income', 'Equity', 'Real Estate', 'Alternative'];
  return (
    <div className="space-y-6">
      <ChartCard title="Allocation Evolution (% of Portfolio)" height={300}>
        <ResponsiveContainer>
          <BarChart data={evolutionSeries} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f4" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#657381' }} />
            <YAxis tick={{ fontSize: 11, fill: '#657381' }} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {keys.map((k, i) => <Bar key={k} dataKey={k} stackId="a" fill={CHART[i]} />)}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
        <table className="w-full border-collapse">
          <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
            <tr>
              <Th>Asset Class</Th>
              {evolutionSeries.map((p) => <Th key={p.date} align="right">{p.date}</Th>)}
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k} className="border-b border-[#f0f2f4]">
                <Td className="font-medium">{k}</Td>
                {evolutionSeries.map((p) => <Td key={p.date} align="right">{p[k]}%</Td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── MULTI-SECTION: CRM2 ───────────────────────────────────────────────────
function CRM2Report() {
  return (
    <div className="space-y-7">
      <div>
        <SectionLabel>Section 1 — Charges &amp; Compensation</SectionLabel>
        <div className="overflow-hidden rounded-lg border border-[#e9ecef]">
          <table className="w-full border-collapse">
            <tbody>
              {crm2Charges.map((c) => (
                <tr key={c.category} className={cn('border-b border-[#f0f2f4]', c.isSubtotal && 'bg-[#f8f9fa]')}>
                  <Td className={cn(c.indent && 'pl-7 text-[#657381]', c.isSubtotal && 'font-semibold')}>{c.category}</Td>
                  <Td align="right" className={cn(c.isSubtotal && 'font-semibold')}>{c.isSubtotal && c.amount === 0 ? '' : formatCurrency(c.amount, CURRENCY, { decimals: 2 })}</Td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#0645ad] bg-[#eef3fb] font-semibold text-[#0645ad]">
                <Td className="font-semibold text-[#0645ad]">Total Compensation</Td>
                <Td align="right" className="text-[#0645ad]">{formatCurrency(crm2TotalCompensation, CURRENCY, { decimals: 2 })}</Td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <SectionLabel>Section 2 — Investment Performance</SectionLabel>
        <ChartCard title="Market Value vs. Net Contributions">
          <ResponsiveContainer>
            <LineChart data={marketValueVsInvestment} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f4" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#657381' }} />
              <YAxis tick={{ fontSize: 11, fill: '#657381' }} tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="marketValue" name="Market Value" stroke={CHART[0]} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="netInvestment" name="Net Contributions" stroke={CHART[2]} strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <div className="mb-2 text-[12px] font-semibold text-[#657381]">Returns (TWR / MWR)</div>
            <div className="overflow-hidden rounded-lg border border-[#e9ecef]">
              <table className="w-full border-collapse">
                <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
                  <tr><Th>Period</Th><Th align="right">TWR</Th><Th align="right">MWR</Th></tr>
                </thead>
                <tbody>
                  {crm2Performance.map((p) => (
                    <tr key={p.period} className="border-b border-[#f0f2f4]">
                      <Td>{p.period}</Td>
                      <Td align="right" className={signClass(p.twr)}>{formatSignedPercent(p.twr, 1)}</Td>
                      <Td align="right" className={signClass(p.mwr)}>{formatSignedPercent(p.mwr, 1)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <div className="mb-2 text-[12px] font-semibold text-[#657381]">Portfolio Activity</div>
            <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
              <table className="w-full border-collapse">
                <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
                  <tr><Th>&nbsp;</Th><Th align="right">QTD</Th><Th align="right">YTD</Th><Th align="right">Since Incep.</Th></tr>
                </thead>
                <tbody>
                  {crm2Activity.map((a) => (
                    <tr key={a.label} className="border-b border-[#f0f2f4]">
                      <Td className={cn(/Ending|Net|Beginning/.test(a.label) && 'font-medium')}>{a.label}</Td>
                      <Td align="right" className={signClass(a.qtd)}>{formatCurrency(a.qtd)}</Td>
                      <Td align="right" className={signClass(a.ytd)}>{formatCurrency(a.ytd)}</Td>
                      <Td align="right" className={signClass(a.si)}>{a.si === 0 ? '—' : formatCurrency(a.si)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MULTI-SECTION: Consolidated Activity ──────────────────────────────────
function ConsolidatedActivityReport() {
  return (
    <div className="space-y-6">
      {consolidatedActivity.map((section) => {
        const subtotal = section.lines.reduce((s, l) => s + l.amount, 0);
        return (
          <div key={section.title}>
            <SectionLabel>{section.title}</SectionLabel>
            <div className="overflow-hidden rounded-lg border border-[#e9ecef]">
              <table className="w-full border-collapse">
                <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
                  <tr><Th>Category</Th><Th>Date</Th><Th>Account</Th><Th align="right">Quantity</Th><Th align="right">Amount</Th></tr>
                </thead>
                <tbody>
                  {section.lines.map((l, i) => (
                    <tr key={i} className="border-b border-[#f0f2f4]">
                      <Td className="font-medium">{l.category}</Td>
                      <Td>{formatDate(l.date)}</Td>
                      <Td className="text-[#657381]">{l.account}</Td>
                      <Td align="right">{l.quantity ? formatNumber(l.quantity) : '—'}</Td>
                      <Td align="right" className={signClass(l.amount)}>{formatCurrency(l.amount)}</Td>
                    </tr>
                  ))}
                  <tr className="border-b border-[#e9ecef] bg-[#f8f9fa] font-semibold">
                    <Td className="font-semibold">{section.title} Subtotal</Td>
                    <td colSpan={3} />
                    <Td align="right" className={signClass(subtotal)}>{formatCurrency(subtotal)}</Td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── TRANSACTIONS: transactions / transactions-fx / realized-gains ─────────
function TransactionsReport({ report }: { report: ReportType }) {
  if (report.id === 'realized-gains-losses') {
    const totalGL = realizedGains.reduce((s, r) => s + r.realizedGL, 0);
    return (
      <div>
        <SectionLabel>Realized Gains and Losses</SectionLabel>
        <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
          <table className="w-full border-collapse">
            <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
              <tr>
                <Th>Trade Date</Th><Th>Account</Th><Th>Activity</Th><Th>Security</Th>
                <Th align="right">Qty</Th><Th align="right">Cost Basis</Th><Th align="right">Proceeds</Th><Th align="right">Realized G/L</Th>
              </tr>
            </thead>
            <tbody>
              {realizedGains.map((r, i) => (
                <tr key={i} className="border-b border-[#f0f2f4]">
                  <Td>{formatDate(r.tradeDate)}</Td>
                  <Td className="text-[#657381]">{r.account}</Td>
                  <Td>{r.activity}</Td>
                  <Td><span className="font-medium">{r.security}</span><span className="ml-2 text-xs text-[#9aa5b1]">{r.symbol}</span></Td>
                  <Td align="right">{formatNumber(r.quantity)}</Td>
                  <Td align="right">{formatCurrency(r.costBasis)}</Td>
                  <Td align="right">{formatCurrency(r.proceeds)}</Td>
                  <Td align="right" className={signClass(r.realizedGL)}>{formatCurrency(r.realizedGL)}</Td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#0645ad] bg-[#eef3fb] font-semibold text-[#0645ad]">
                <Td className="font-semibold text-[#0645ad]">Total Realized Gain / Loss</Td>
                <td colSpan={6} />
                <Td align="right" className="text-[#0645ad]">{formatCurrency(totalGL)}</Td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  const fx = report.id === 'transactions-fx';
  return (
    <div>
      <SectionLabel>Transaction Detail</SectionLabel>
      <div className="overflow-x-auto rounded-lg border border-[#e9ecef]">
        <table className="w-full border-collapse">
          <thead className="border-b border-[#e9ecef] bg-[#f8f9fa]">
            <tr>
              <Th>Trade Date</Th><Th>Settle Date</Th><Th>Account</Th><Th>Activity</Th><Th>Security</Th>
              <Th align="center">Ccy</Th><Th align="right">Quantity</Th><Th align="right">Price</Th>
              {fx && <Th align="right">FX Rate</Th>}
              <Th align="right">Amount</Th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => (
              <tr key={i} className="border-b border-[#f0f2f4]">
                <Td>{formatDate(t.tradeDate)}</Td>
                <Td className="text-[#657381]">{formatDate(t.settleDate)}</Td>
                <Td className="text-[#657381]">{t.account}</Td>
                <Td className="font-medium">{t.activity}</Td>
                <Td><span className="font-medium">{t.security}</span>{t.symbol !== '—' && <span className="ml-2 text-xs text-[#9aa5b1]">{t.symbol}</span>}</Td>
                <Td align="center">{t.currency}</Td>
                <Td align="right">{t.quantity ? formatNumber(t.quantity) : '—'}</Td>
                <Td align="right">{t.price ? formatCurrency(t.price, t.currency, { decimals: 2 }) : '—'}</Td>
                {fx && <Td align="right">{t.fxRate.toFixed(4)}</Td>}
                <Td align="right" className={signClass(t.amount)}>{formatCurrency(t.amount)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-[#9aa5b1]">
        {fx ? 'Transaction amounts converted to reporting currency at the FX rate shown.' : 'Line-by-line activity for the selected period, in reporting currency.'}
      </p>
    </div>
  );
}
