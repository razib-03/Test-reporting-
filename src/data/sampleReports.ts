/**
 * Mock datasets that drive every sample report renderer.
 * Numbers loosely reconcile to the Okafor household (totalMarketValue).
 */
import { totalMarketValue } from './clients';

const TOTAL = totalMarketValue; // 5,547,090

// ── deterministic PRNG so charts are stable across reloads ────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Performance: monthly returns since inception (Sep 2012) ───────────────
export interface MonthlyReturn {
  year: number;
  month: number; // 1-12
  ret: number; // percent
}

function buildMonthlyReturns(): MonthlyReturn[] {
  const rng = mulberry32(7);
  const out: MonthlyReturn[] = [];
  let y = 2012;
  let m = 9;
  const endY = 2026;
  const endM = 6;
  while (y < endY || (y === endY && m <= endM)) {
    // mean ~0.62%/mo with realistic dispersion + occasional drawdowns
    const base = 0.62;
    const noise = (rng() - 0.48) * 5.2;
    const shock = rng() < 0.08 ? -(rng() * 6) : 0;
    out.push({ year: y, month: m, ret: +(base + noise + shock).toFixed(2) });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

export const monthlyReturns = buildMonthlyReturns();

// Cumulative growth series (start at 0%) for the line graph
export interface CumulativePoint {
  date: string; // YYYY-MM
  value: number; // cumulative TWR %
}

export const cumulativeReturnSeries: CumulativePoint[] = (() => {
  let factor = 1;
  return monthlyReturns.map((r) => {
    factor *= 1 + r.ret / 100;
    return {
      date: `${r.year}-${String(r.month).padStart(2, '0')}`,
      value: +((factor - 1) * 100).toFixed(1),
    };
  });
})();

// Monthly returns laid out as a Jan–Dec grid per calendar year
export interface MonthlyReturnsRow {
  year: number;
  months: (number | null)[]; // 12 entries
  total: number | null;
  cumulative: number;
}

export const monthlyReturnsByYear: MonthlyReturnsRow[] = (() => {
  const years = Array.from(new Set(monthlyReturns.map((r) => r.year)));
  let runningFactor = 1;
  return years.map((year) => {
    const months: (number | null)[] = Array(12).fill(null);
    monthlyReturns
      .filter((r) => r.year === year)
      .forEach((r) => (months[r.month - 1] = r.ret));
    const present = months.filter((v): v is number => v !== null);
    const yearFactor = present.reduce((f, v) => f * (1 + v / 100), 1);
    const total = present.length === 12 ? +((yearFactor - 1) * 100).toFixed(2) : null;
    runningFactor *= yearFactor;
    return {
      year,
      months,
      total,
      cumulative: +((runningFactor - 1) * 100).toFixed(1),
    };
  });
})();

export interface SummaryStats {
  returnCumulative: number;
  returnAnnualized: number;
  volatilityAnnualized: number;
  sharpeRatio: number;
  positiveMonths: number;
  negativeMonths: number;
  maxDrawdown: number;
}

export const summaryStats: SummaryStats = (() => {
  const rets = monthlyReturns.map((r) => r.ret);
  const n = rets.length;
  const mean = rets.reduce((s, v) => s + v, 0) / n;
  const variance = rets.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const volMonthly = Math.sqrt(variance);
  const factor = rets.reduce((f, v) => f * (1 + v / 100), 1);
  const cumulative = (factor - 1) * 100;
  const years = n / 12;
  const annualized = (Math.pow(factor, 1 / years) - 1) * 100;
  const volAnnual = volMonthly * Math.sqrt(12);
  const pos = rets.filter((v) => v > 0).length;
  // max drawdown off the cumulative series
  let peak = -Infinity;
  let maxDd = 0;
  let f = 1;
  for (const v of rets) {
    f *= 1 + v / 100;
    peak = Math.max(peak, f);
    maxDd = Math.min(maxDd, f / peak - 1);
  }
  return {
    returnCumulative: +cumulative.toFixed(1),
    returnAnnualized: +annualized.toFixed(2),
    volatilityAnnualized: +volAnnual.toFixed(2),
    sharpeRatio: +(annualized / volAnnual).toFixed(2),
    positiveMonths: +((pos / n) * 100).toFixed(1),
    negativeMonths: +(((n - pos) / n) * 100).toFixed(1),
    maxDrawdown: +(maxDd * 100).toFixed(1),
  };
})();

// Market value vs. net investment (yearly points for Portfolio Overview / CRM2)
export interface MVPoint {
  date: string;
  marketValue: number;
  netInvestment: number;
}

export const marketValueVsInvestment: MVPoint[] = (() => {
  const points: MVPoint[] = [];
  let invested = 1_650_000;
  let mv = 1_650_000;
  for (let yr = 2013; yr <= 2026; yr++) {
    const contribution = yr < 2024 ? 220_000 : 90_000;
    invested += contribution;
    mv = (mv + contribution) * (1 + (0.085 + (mulberry32(yr)() - 0.5) * 0.12));
    points.push({
      date: String(yr),
      marketValue: Math.round(mv),
      netInvestment: Math.round(invested),
    });
  }
  // anchor the final point to the real household MV
  points[points.length - 1].marketValue = TOTAL;
  return points;
})();

// ── Calendar-year & trailing returns (grouped by asset class) ─────────────
export const calendarYears = [2021, 2022, 2023, 2024, 2025, 2026];

export interface ReturnRow {
  name: string;
  marketValue: number;
  pctPortfolio: number;
  inceptionDate: string;
  calendar: number[]; // aligned to calendarYears (last = YTD)
  sinceInception: number;
  trailing: { mtd: number; qtd: number; ytd: number; y1: number; y2: number; y3: number; y4: number; y5: number; y7: number; y10: number; si: number };
  kind?: 'asset' | 'benchmark' | 'difference' | 'total';
}

export const returnRows: ReturnRow[] = [
  {
    name: 'Cash & Cash Equivalent',
    marketValue: 277_355,
    pctPortfolio: 5.0,
    inceptionDate: '2012-09-21',
    calendar: [0.4, 1.6, 4.8, 5.1, 4.6, 2.1],
    sinceInception: 1.8,
    trailing: { mtd: 0.3, qtd: 1.0, ytd: 2.1, y1: 4.7, y2: 4.9, y3: 3.6, y4: 2.8, y5: 2.4, y7: 2.1, y10: 1.9, si: 1.8 },
    kind: 'asset',
  },
  {
    name: 'Fixed Income',
    marketValue: 1_553_185,
    pctPortfolio: 28.0,
    inceptionDate: '2012-09-21',
    calendar: [-2.5, -11.7, 6.7, 4.2, 3.9, 1.6],
    sinceInception: 2.4,
    trailing: { mtd: 0.2, qtd: 0.9, ytd: 1.6, y1: 4.1, y2: 4.0, y3: 0.1, y4: -0.4, y5: 0.6, y7: 1.5, y10: 2.0, si: 2.4 },
    kind: 'asset',
  },
  {
    name: 'Equity',
    marketValue: 2_607_132,
    pctPortfolio: 47.0,
    inceptionDate: '2012-09-21',
    calendar: [22.4, -14.6, 21.8, 18.2, 16.4, 7.9],
    sinceInception: 11.6,
    trailing: { mtd: 1.4, qtd: 4.8, ytd: 7.9, y1: 16.9, y2: 17.1, y3: 8.4, y4: 9.9, y5: 12.2, y7: 11.0, y10: 11.4, si: 11.6 },
    kind: 'asset',
  },
  {
    name: 'Real Estate',
    marketValue: 443_767,
    pctPortfolio: 8.0,
    inceptionDate: '2014-01-15',
    calendar: [12.1, -9.4, 4.2, 6.8, 7.1, 3.4],
    sinceInception: 6.2,
    trailing: { mtd: 0.6, qtd: 1.9, ytd: 3.4, y1: 7.0, y2: 7.1, y3: 0.3, y4: 2.6, y5: 4.1, y7: 5.5, y10: 6.0, si: 6.2 },
    kind: 'asset',
  },
  {
    name: 'Alternative',
    marketValue: 665_651,
    pctPortfolio: 12.0,
    inceptionDate: '2015-04-01',
    calendar: [9.8, 3.2, 7.4, 9.1, 10.6, 4.8],
    sinceInception: 8.1,
    trailing: { mtd: 0.7, qtd: 2.6, ytd: 4.8, y1: 10.4, y2: 10.0, y3: 7.6, y4: 8.0, y5: 8.4, y7: 8.0, y10: 8.1, si: 8.1 },
    kind: 'asset',
  },
];

export const portfolioReturnRow: ReturnRow = {
  name: 'Total Portfolio',
  marketValue: TOTAL,
  pctPortfolio: 100,
  inceptionDate: '2012-09-21',
  calendar: [13.6, -10.2, 14.1, 12.4, 11.8, 5.6],
  sinceInception: 8.4,
  trailing: { mtd: 0.9, qtd: 3.3, ytd: 5.6, y1: 11.9, y2: 11.7, y3: 5.2, y4: 6.1, y5: 7.8, y7: 7.9, y10: 8.2, si: 8.4 },
  kind: 'total',
};

export const benchmarkReturnRow: ReturnRow = {
  name: '60/40 Global Balanced Index',
  marketValue: 0,
  pctPortfolio: 0,
  inceptionDate: '2012-09-21',
  calendar: [12.1, -11.4, 13.0, 11.2, 10.9, 5.1],
  sinceInception: 7.6,
  trailing: { mtd: 0.8, qtd: 3.0, ytd: 5.1, y1: 11.0, y2: 10.6, y3: 4.4, y4: 5.3, y5: 6.9, y7: 7.1, y10: 7.4, si: 7.6 },
  kind: 'benchmark',
};

export const differenceReturnRow: ReturnRow = (() => {
  const c = portfolioReturnRow.calendar.map((v, i) => +(v - benchmarkReturnRow.calendar[i]).toFixed(1));
  const t = portfolioReturnRow.trailing;
  const b = benchmarkReturnRow.trailing;
  return {
    name: 'Difference (Active Return)',
    marketValue: 0,
    pctPortfolio: 0,
    inceptionDate: '2012-09-21',
    calendar: c,
    sinceInception: +(portfolioReturnRow.sinceInception - benchmarkReturnRow.sinceInception).toFixed(1),
    trailing: {
      mtd: +(t.mtd - b.mtd).toFixed(1), qtd: +(t.qtd - b.qtd).toFixed(1), ytd: +(t.ytd - b.ytd).toFixed(1),
      y1: +(t.y1 - b.y1).toFixed(1), y2: +(t.y2 - b.y2).toFixed(1), y3: +(t.y3 - b.y3).toFixed(1),
      y4: +(t.y4 - b.y4).toFixed(1), y5: +(t.y5 - b.y5).toFixed(1), y7: +(t.y7 - b.y7).toFixed(1),
      y10: +(t.y10 - b.y10).toFixed(1), si: +(t.si - b.si).toFixed(1),
    },
    kind: 'difference',
  };
})();

// ── Asset allocation (L1 → L2) ────────────────────────────────────────────
export interface AllocationSub {
  name: string;
  marketValue: number;
  pct: number;
}
export interface AllocationGroup {
  name: string;
  marketValue: number;
  pct: number;
  color: string;
  subs: AllocationSub[];
}

const pct = (mv: number) => +((mv / TOTAL) * 100).toFixed(1);

export const assetAllocation: AllocationGroup[] = [
  {
    name: 'Cash & Cash Equivalent', marketValue: 277_355, pct: pct(277_355), color: '#0ea5b5',
    subs: [
      { name: 'Cash', marketValue: 177_355, pct: pct(177_355) },
      { name: 'Money Market', marketValue: 100_000, pct: pct(100_000) },
    ],
  },
  {
    name: 'Fixed Income', marketValue: 1_553_185, pct: pct(1_553_185), color: '#0645ad',
    subs: [
      { name: 'Government Bonds', marketValue: 720_000, pct: pct(720_000) },
      { name: 'Corporate Bonds', marketValue: 633_185, pct: pct(633_185) },
      { name: 'High Yield', marketValue: 200_000, pct: pct(200_000) },
    ],
  },
  {
    name: 'Equity', marketValue: 2_607_132, pct: pct(2_607_132), color: '#2f9e6e',
    subs: [
      { name: 'Canadian Equity', marketValue: 720_000, pct: pct(720_000) },
      { name: 'US Equity', marketValue: 1_187_132, pct: pct(1_187_132) },
      { name: 'International Equity', marketValue: 700_000, pct: pct(700_000) },
    ],
  },
  {
    name: 'Real Estate', marketValue: 443_767, pct: pct(443_767), color: '#e0a106',
    subs: [
      { name: 'REITs', marketValue: 243_767, pct: pct(243_767) },
      { name: 'Direct Property', marketValue: 200_000, pct: pct(200_000) },
    ],
  },
  {
    name: 'Alternative', marketValue: 665_651, pct: pct(665_651), color: '#6c5ce7',
    subs: [
      { name: 'Private Equity', marketValue: 365_651, pct: pct(365_651) },
      { name: 'Hedge Funds', marketValue: 300_000, pct: pct(300_000) },
    ],
  },
];

// ── Portfolio Exposures (multiple grouping dimensions) ────────────────────
export interface ExposureDimension {
  dimension: string;
  slices: { name: string; marketValue: number; pct: number; color: string }[];
}

export const exposureDimensions: ExposureDimension[] = [
  {
    dimension: 'By Geography',
    slices: [
      { name: 'Canada', marketValue: 2_106_000, pct: pct(2_106_000), color: '#0645ad' },
      { name: 'United States', marketValue: 2_218_000, pct: pct(2_218_000), color: '#2f9e6e' },
      { name: 'International Developed', marketValue: 888_000, pct: pct(888_000), color: '#e0a106' },
      { name: 'Emerging Markets', marketValue: 335_090, pct: pct(335_090), color: '#6c5ce7' },
    ],
  },
  {
    dimension: 'By Sector',
    slices: [
      { name: 'Financials', marketValue: 1_220_000, pct: pct(1_220_000), color: '#0645ad' },
      { name: 'Technology', marketValue: 1_109_000, pct: pct(1_109_000), color: '#2f9e6e' },
      { name: 'Energy', marketValue: 610_000, pct: pct(610_000), color: '#e0a106' },
      { name: 'Healthcare', marketValue: 555_000, pct: pct(555_000), color: '#6c5ce7' },
      { name: 'Other', marketValue: 2_053_090, pct: pct(2_053_090), color: '#0ea5b5' },
    ],
  },
  {
    dimension: 'By Currency',
    slices: [
      { name: 'CAD', marketValue: 4_300_000, pct: pct(4_300_000), color: '#0645ad' },
      { name: 'USD', marketValue: 1_050_090, pct: pct(1_050_090), color: '#2f9e6e' },
      { name: 'EUR', marketValue: 197_000, pct: pct(197_000), color: '#e0a106' },
    ],
  },
];

// ── Evolution of exposures (monthly % allocation) ─────────────────────────
export interface EvolutionPoint {
  date: string;
  Cash: number;
  'Fixed Income': number;
  Equity: number;
  'Real Estate': number;
  Alternative: number;
}

export const evolutionSeries: EvolutionPoint[] = [
  { date: 'Jul 25', Cash: 7, 'Fixed Income': 31, Equity: 43, 'Real Estate': 8, Alternative: 11 },
  { date: 'Aug 25', Cash: 6, 'Fixed Income': 30, Equity: 44, 'Real Estate': 8, Alternative: 12 },
  { date: 'Sep 25', Cash: 6, 'Fixed Income': 30, Equity: 45, 'Real Estate': 8, Alternative: 11 },
  { date: 'Oct 25', Cash: 5, 'Fixed Income': 29, Equity: 46, 'Real Estate': 8, Alternative: 12 },
  { date: 'Nov 25', Cash: 5, 'Fixed Income': 29, Equity: 46, 'Real Estate': 8, Alternative: 12 },
  { date: 'Dec 25', Cash: 5, 'Fixed Income': 28, Equity: 47, 'Real Estate': 8, Alternative: 12 },
  { date: 'Jan 26', Cash: 6, 'Fixed Income': 28, Equity: 46, 'Real Estate': 8, Alternative: 12 },
  { date: 'Feb 26', Cash: 5, 'Fixed Income': 28, Equity: 47, 'Real Estate': 8, Alternative: 12 },
  { date: 'Mar 26', Cash: 5, 'Fixed Income': 28, Equity: 47, 'Real Estate': 8, Alternative: 12 },
  { date: 'Apr 26', Cash: 5, 'Fixed Income': 28, Equity: 47, 'Real Estate': 8, Alternative: 12 },
  { date: 'May 26', Cash: 5, 'Fixed Income': 28, Equity: 47, 'Real Estate': 8, Alternative: 12 },
  { date: 'Jun 26', Cash: 5, 'Fixed Income': 28, Equity: 47, 'Real Estate': 8, Alternative: 12 },
];

// ── Holdings (Portfolio Valuation / Valuation) ────────────────────────────
export interface Holding {
  assetClass: string;
  security: string;
  symbol: string;
  quantity: number;
  unitCost: number;
  price: number;
  bookValue: number;
  marketValue: number;
  unrealizedGL: number;
  unrealizedPct: number;
  pctPortfolio: number;
}

function holding(assetClass: string, security: string, symbol: string, quantity: number, unitCost: number, price: number): Holding {
  const bookValue = Math.round(quantity * unitCost);
  const marketValue = Math.round(quantity * price);
  const unrealizedGL = marketValue - bookValue;
  return {
    assetClass, security, symbol, quantity, unitCost, price, bookValue, marketValue,
    unrealizedGL,
    unrealizedPct: +((unrealizedGL / bookValue) * 100).toFixed(1),
    pctPortfolio: +((marketValue / TOTAL) * 100).toFixed(1),
  };
}

export const holdings: Holding[] = [
  holding('Cash & Cash Equivalent', 'Canadian Dollar Cash', 'CAD', 177_355, 1, 1),
  holding('Cash & Cash Equivalent', 'Purpose High Interest Savings ETF', 'PSA', 1_996, 50.1, 50.1),
  holding('Fixed Income', 'iShares Core CDN Universe Bond', 'XBB', 24_700, 31.2, 29.15),
  holding('Fixed Income', 'BMO Corporate Bond Index ETF', 'ZCM', 39_800, 17.4, 15.91),
  holding('Fixed Income', 'iShares US High Yield Bond', 'XHY', 9_950, 19.1, 20.10),
  holding('Equity', 'Royal Bank of Canada', 'RY', 2_400, 118.0, 150.00),
  holding('Equity', 'Canadian Natural Resources', 'CNQ', 7_200, 38.0, 50.00),
  holding('Equity', 'Apple Inc.', 'AAPL', 1_550, 142.0, 258.06),
  holding('Equity', 'Microsoft Corp.', 'MSFT', 940, 268.0, 446.81),
  holding('Equity', 'NVIDIA Corp.', 'NVDA', 2_950, 41.0, 124.45),
  holding('Equity', 'Vanguard FTSE Developed ex-NA', 'VIU', 17_900, 32.0, 39.11),
  holding('Real Estate', 'Canadian Apartment Properties REIT', 'CAR.UN', 5_650, 51.0, 43.15),
  holding('Real Estate', 'Purpose Real Estate Income Fund', 'PRP', 18_180, 9.9, 11.00),
  holding('Alternative', 'Purpose Private Equity Access Fund', 'PE-I', 3_300, 95.0, 110.80),
  holding('Alternative', 'Polar Long/Short Fund', 'POL', 2_500, 108.0, 120.00),
];

// ── Private Equity ────────────────────────────────────────────────────────
export interface PERow {
  fund: string;
  currency: string;
  commitment: number;
  paidIn: number;
  callable: number;
  distribution: number;
  netInvestments: number;
  residualValue: number;
  dpi: number;
  rvpi: number;
  tvpi: number;
  irr: number;
}

export const privateEquity: PERow[] = [
  { fund: 'Northleaf Venture Catalyst III', currency: 'CAD', commitment: 500_000, paidIn: 410_000, callable: 90_000, distribution: 185_000, netInvestments: 225_000, residualValue: 365_651, dpi: 0.45, rvpi: 0.89, tvpi: 1.34, irr: 14.8 },
  { fund: 'Brookfield Infrastructure IV', currency: 'CAD', commitment: 300_000, paidIn: 270_000, callable: 30_000, distribution: 96_000, netInvestments: 174_000, residualValue: 244_000, dpi: 0.36, rvpi: 0.90, tvpi: 1.26, irr: 11.2 },
  { fund: 'Sequoia Growth Fund (USD)', currency: 'USD', commitment: 250_000, paidIn: 200_000, callable: 50_000, distribution: 60_000, netInvestments: 140_000, residualValue: 286_000, dpi: 0.30, rvpi: 1.43, tvpi: 1.73, irr: 19.6 },
];

// ── Transactions ──────────────────────────────────────────────────────────
export interface TxnRow {
  tradeDate: string;
  processDate: string;
  settleDate: string;
  account: string;
  activity: string;
  symbol: string;
  security: string;
  currency: string;
  quantity: number;
  price: number;
  fxRate: number;
  amount: number;
}

export const transactions: TxnRow[] = [
  { tradeDate: '2026-06-02', processDate: '2026-06-02', settleDate: '2026-06-04', account: 'AC-10021', activity: 'Buy', symbol: 'XBB', security: 'iShares Core CDN Universe Bond', currency: 'CAD', quantity: 1_200, price: 29.15, fxRate: 1, amount: -34_980 },
  { tradeDate: '2026-05-21', processDate: '2026-05-21', settleDate: '2026-05-23', account: 'AC-10023', activity: 'Sell', symbol: 'AAPL', security: 'Apple Inc.', currency: 'USD', quantity: -150, price: 258.06, fxRate: 1.366, amount: 52_876 },
  { tradeDate: '2026-05-15', processDate: '2026-05-15', settleDate: '2026-05-15', account: 'AC-10021', activity: 'Dividend', symbol: 'RY', security: 'Royal Bank of Canada', currency: 'CAD', quantity: 0, price: 0, fxRate: 1, amount: 3_408 },
  { tradeDate: '2026-04-30', processDate: '2026-04-30', settleDate: '2026-05-02', account: 'AC-10031', activity: 'Transfer In', symbol: '—', security: 'Cash Contribution', currency: 'CAD', quantity: 0, price: 0, fxRate: 1, amount: 25_000 },
  { tradeDate: '2026-04-18', processDate: '2026-04-18', settleDate: '2026-04-22', account: 'AC-10023', activity: 'Buy', symbol: 'NVDA', security: 'NVIDIA Corp.', currency: 'USD', quantity: 200, price: 124.45, fxRate: 1.371, amount: -34_124 },
  { tradeDate: '2026-03-29', processDate: '2026-03-29', settleDate: '2026-03-29', account: 'AC-10041', activity: 'Interest', symbol: 'XBB', security: 'iShares Core CDN Universe Bond', currency: 'CAD', quantity: 0, price: 0, fxRate: 1, amount: 1_842 },
  { tradeDate: '2026-03-11', processDate: '2026-03-11', settleDate: '2026-03-13', account: 'AC-10022', activity: 'Switch Out', symbol: 'ZCM', security: 'BMO Corporate Bond Index ETF', currency: 'CAD', quantity: -800, price: 15.91, fxRate: 1, amount: 12_728 },
  { tradeDate: '2026-02-27', processDate: '2026-02-27', settleDate: '2026-03-01', account: 'AC-10041', activity: 'Withdrawal', symbol: '—', security: 'Cash Withdrawal', currency: 'CAD', quantity: 0, price: 0, fxRate: 1, amount: -40_000 },
];

// ── Realized Gains and Losses ─────────────────────────────────────────────
export interface RealizedRow {
  tradeDate: string;
  settleDate: string;
  account: string;
  activity: string;
  security: string;
  symbol: string;
  quantity: number;
  costBasis: number;
  proceeds: number;
  realizedGL: number;
}

export const realizedGains: RealizedRow[] = [
  { tradeDate: '2026-05-21', settleDate: '2026-05-23', account: 'AC-10023', activity: 'Sell', security: 'Apple Inc.', symbol: 'AAPL', quantity: 150, costBasis: 21_300, proceeds: 38_709, realizedGL: 17_409 },
  { tradeDate: '2026-03-11', settleDate: '2026-03-13', account: 'AC-10022', activity: 'Sell', security: 'BMO Corporate Bond Index ETF', symbol: 'ZCM', quantity: 800, costBasis: 13_920, proceeds: 12_728, realizedGL: -1_192 },
  { tradeDate: '2026-02-04', settleDate: '2026-02-06', account: 'AC-10021', activity: 'Sell', security: 'Canadian Natural Resources', symbol: 'CNQ', quantity: 600, costBasis: 22_800, proceeds: 30_000, realizedGL: 7_200 },
  { tradeDate: '2026-01-19', settleDate: '2026-01-21', account: 'AC-10031', activity: 'Sell', security: 'iShares US High Yield Bond', symbol: 'XHY', quantity: 1_050, costBasis: 20_055, proceeds: 21_105, realizedGL: 1_050 },
];

// ── Account flows (Account Overview / Reconciliation) ─────────────────────
export interface FlowRow {
  name: string;
  type: string;
  id: string;
  inceptionDate: string;
  beginning: number;
  inflows: number;
  outflows: number;
  gains: number;
  ending: number;
  pctPortfolio: number;
  twr?: number;
  mwr?: number;
}

export const accountFlows: FlowRow[] = [
  { name: 'Daniel Okafor — RRSP', type: 'RRSP', id: 'AC-10021', inceptionDate: '2014-03-12', beginning: 1_198_200, inflows: 24_000, outflows: 0, gains: 62_300, ending: 1_284_500, pctPortfolio: 23.2, twr: 5.1, mwr: 5.0 },
  { name: 'Daniel Okafor — TFSA', type: 'TFSA', id: 'AC-10022', inceptionDate: '2016-01-08', beginning: 131_900, inflows: 7_000, outflows: 0, gains: 3_400, ending: 142_300, pctPortfolio: 2.6, twr: 2.5, mwr: 2.4 },
  { name: 'Daniel Okafor — Non-Reg', type: 'Non-Registered', id: 'AC-10023', inceptionDate: '2012-09-21', beginning: 1_011_400, inflows: 0, outflows: -90_000, gains: 47_350, ending: 968_750, pctPortfolio: 17.5, twr: 4.8, mwr: 4.6 },
  { name: 'Amara Okafor — RRSP', type: 'RRSP', id: 'AC-10031', inceptionDate: '2015-06-02', beginning: 668_500, inflows: 25_000, outflows: 0, gains: 19_400, ending: 712_900, pctPortfolio: 12.9, twr: 2.9, mwr: 2.8 },
  { name: 'Amara Okafor — TFSA', type: 'TFSA', id: 'AC-10032', inceptionDate: '2017-02-14', beginning: 91_200, inflows: 6_500, outflows: 0, gains: 940, ending: 98_640, pctPortfolio: 1.8, twr: 1.0, mwr: 1.0 },
  { name: 'Okafor Family Trust', type: 'Trust', id: 'AC-10041', inceptionDate: '2018-11-30', beginning: 2_255_000, inflows: 0, outflows: -40_000, gains: 125_000, ending: 2_340_000, pctPortfolio: 42.2, twr: 5.6, mwr: 5.4 },
];

// ── Net Worth (balance sheet by member) ───────────────────────────────────
export interface NetWorthRow {
  label: string;
  daniel: number;
  amara: number;
  trust: number;
  indent?: boolean;
  isSubtotal?: boolean;
}
export interface NetWorthSection {
  title: string;
  rows: NetWorthRow[];
}

export const netWorthSections: NetWorthSection[] = [
  {
    title: 'Assets',
    rows: [
      { label: 'Cash & Cash Equivalent', daniel: 96_000, amara: 61_355, trust: 120_000, indent: true },
      { label: 'Fixed Income', daniel: 540_000, amara: 333_185, trust: 680_000, indent: true },
      { label: 'Equity', daniel: 1_207_132, amara: 480_000, trust: 920_000, indent: true },
      { label: 'Real Estate (investments)', daniel: 143_767, amara: 35_000, trust: 265_000, indent: true },
      { label: 'Alternative', daniel: 240_000, amara: 70_651, trust: 355_000, indent: true },
      { label: 'Principal Residence', daniel: 1_350_000, amara: 0, trust: 0, indent: true },
      { label: 'Total Assets', daniel: 3_576_899, amara: 980_191, trust: 2_340_000, isSubtotal: true },
    ],
  },
  {
    title: 'Liabilities',
    rows: [
      { label: 'Mortgage', daniel: -612_000, amara: 0, trust: 0, indent: true },
      { label: 'Line of Credit', daniel: -45_000, amara: -18_000, trust: 0, indent: true },
      { label: 'Total Liabilities', daniel: -657_000, amara: -18_000, trust: 0, isSubtotal: true },
    ],
  },
];

export const netWorthTotals = {
  daniel: 3_576_899 - 657_000,
  amara: 980_191 - 18_000,
  trust: 2_340_000,
};

// estate variant — insurance
export const insuranceRows: NetWorthRow[] = [
  { label: 'Term Life (Daniel)', daniel: 1_500_000, amara: 0, trust: 0, indent: true },
  { label: 'Whole Life (Amara)', daniel: 0, amara: 750_000, trust: 0, indent: true },
];

// ── CRM2 ──────────────────────────────────────────────────────────────────
export interface ChargeRow {
  category: string;
  amount: number;
  indent?: boolean;
  isSubtotal?: boolean;
}

export const crm2Charges: ChargeRow[] = [
  { category: 'Administrative Fees', amount: 0, isSubtotal: true },
  { category: 'Account Administration', amount: 150, indent: true },
  { category: 'Operations & Transfers', amount: 75, indent: true },
  { category: 'Fee-Based Services', amount: 0, isSubtotal: true },
  { category: 'Portfolio Advisory Fee', amount: 41_603, indent: true },
  { category: 'Custody & Asset Administration', amount: 5_547, indent: true },
  { category: 'Third Party Remuneration', amount: 0, isSubtotal: true },
  { category: 'Trailing Commissions', amount: 8_320, indent: true },
  { category: 'New Issues Commissions', amount: 1_100, indent: true },
];
export const crm2TotalCompensation = 56_795;

export interface CRM2PerfRow {
  period: string;
  twr: number;
  mwr: number;
}
export const crm2Performance: CRM2PerfRow[] = [
  { period: 'QTD', twr: 3.3, mwr: 3.2 },
  { period: 'YTD', twr: 5.6, mwr: 5.5 },
  { period: '1 Year', twr: 11.9, mwr: 11.7 },
  { period: '3 Year', twr: 5.2, mwr: 5.0 },
  { period: '5 Year', twr: 7.8, mwr: 7.6 },
  { period: '10 Year', twr: 8.2, mwr: 8.0 },
  { period: 'Since Inception', twr: 8.4, mwr: 8.2 },
];

export interface CRM2ActivityRow {
  label: string;
  qtd: number;
  ytd: number;
  si: number;
}
export const crm2Activity: CRM2ActivityRow[] = [
  { label: 'Beginning Market Value', qtd: 5_372_400, ytd: 5_244_700, si: 0 },
  { label: 'Contributions', qtd: 31_500, ytd: 87_500, si: 3_640_000 },
  { label: 'Withdrawals', qtd: -40_000, ytd: -130_000, si: -1_180_000 },
  { label: 'Net Contributions', qtd: -8_500, ytd: -42_500, si: 2_460_000 },
  { label: 'Fees', qtd: -14_100, ytd: -28_400, si: -312_000 },
  { label: 'Net Cash Flow', qtd: -22_600, ytd: -70_900, si: 2_148_000 },
  { label: 'Market Impact', qtd: 197_290, ytd: 373_290, si: 3_399_090 },
  { label: 'Ending Market Value', qtd: TOTAL, ytd: TOTAL, si: TOTAL },
];

// ── Consolidated Activity (3 sections) ────────────────────────────────────
export interface ActivityLine {
  category: string;
  date: string;
  account: string;
  quantity: number;
  amount: number;
}
export interface ActivitySection {
  title: string;
  lines: ActivityLine[];
}

export const consolidatedActivity: ActivitySection[] = [
  {
    title: 'Inflows & Outflows',
    lines: [
      { category: 'Deposit', date: '2026-04-30', account: 'AC-10031', quantity: 0, amount: 25_000 },
      { category: 'Transfer Cash In', date: '2026-01-12', account: 'AC-10021', quantity: 0, amount: 24_000 },
      { category: 'Withdrawal', date: '2026-02-27', account: 'AC-10041', quantity: 0, amount: -40_000 },
      { category: 'Transfer Cash Out', date: '2026-03-18', account: 'AC-10023', quantity: 0, amount: -90_000 },
    ],
  },
  {
    title: 'Trades',
    lines: [
      { category: 'Buy', date: '2026-06-02', account: 'AC-10021', quantity: 1_200, amount: -34_980 },
      { category: 'Buy', date: '2026-04-18', account: 'AC-10023', quantity: 200, amount: -34_124 },
      { category: 'Sell', date: '2026-05-21', account: 'AC-10023', quantity: -150, amount: 38_709 },
      { category: 'Sell', date: '2026-02-04', account: 'AC-10021', quantity: -600, amount: 30_000 },
    ],
  },
  {
    title: 'Income',
    lines: [
      { category: 'Dividends', date: '2026-05-15', account: 'AC-10021', quantity: 0, amount: 3_408 },
      { category: 'Interest', date: '2026-03-29', account: 'AC-10041', quantity: 0, amount: 1_842 },
      { category: 'Instrument Cashflow', date: '2026-01-31', account: 'AC-10031', quantity: 0, amount: 920 },
    ],
  },
];

// ── Asset Allocation Guidelines (vs IPS) ──────────────────────────────────
export interface GuidelineRow {
  name: string;
  marketValue: number;
  current: number;
  target: number;
  min: number;
  max: number;
}

export const guidelines: GuidelineRow[] = [
  { name: 'Cash & Cash Equivalent', marketValue: 277_355, current: 5.0, target: 5.0, min: 0, max: 10 },
  { name: 'Fixed Income', marketValue: 1_553_185, current: 28.0, target: 30.0, min: 20, max: 40 },
  { name: 'Equity', marketValue: 2_607_132, current: 47.0, target: 45.0, min: 35, max: 55 },
  { name: 'Real Estate', marketValue: 443_767, current: 8.0, target: 8.0, min: 0, max: 15 },
  { name: 'Alternative', marketValue: 665_651, current: 12.0, target: 12.0, min: 5, max: 20 },
];

// ── Foreign Property (T1135) ──────────────────────────────────────────────
export interface ForeignPropertyRow {
  country: string;
  security: string;
  symbol: string;
  monthly: number[]; // 12 month-end book values
  income: number;
  realizedGL: number;
  maxBook: number;
  yearEnd: number;
}

function fpRow(country: string, security: string, symbol: string, start: number, drift: number, income: number, realizedGL: number): ForeignPropertyRow {
  const monthly = Array.from({ length: 12 }, (_, i) => Math.round(start + drift * i + (mulberry32(i + start)() - 0.5) * start * 0.04));
  return { country, security, symbol, monthly, income, realizedGL, maxBook: Math.max(...monthly), yearEnd: monthly[11] };
}

export const foreignProperty: ForeignPropertyRow[] = [
  fpRow('United States', 'Apple Inc.', 'AAPL', 198_000, 3_400, 1_240, 17_409),
  fpRow('United States', 'Microsoft Corp.', 'MSFT', 372_000, 5_900, 2_980, 0),
  fpRow('United States', 'NVIDIA Corp.', 'NVDA', 90_000, 22_000, 0, 0),
  fpRow('Ireland', 'Vanguard FTSE Developed ex-NA', 'VIU', 540_000, 2_100, 9_700, 0),
];
