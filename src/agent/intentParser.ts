import { reports, getReport } from '@/data/reportCatalog';
import { household, contacts } from '@/data/clients';
import { PERIODS, CURRENCIES, DEFAULT_AS_OF, REPORTING_YEAR } from './constants';

/** Keyword → reportTypeId scoring map. First-match order breaks ties. */
const REPORT_KEYWORDS: { id: string; words: string[] }[] = [
  { id: 'net-worth', words: ['net worth', 'networth', 'balance sheet', 'estate', 'assets and liabilities'] },
  { id: 'crm2', words: ['crm2', 'crm 2', 'fee disclosure', 'charges and compensation', 'annual disclosure', 'regulatory'] },
  { id: 'foreign-property', words: ['foreign property', 't1135', 'foreign holdings'] },
  { id: 'realized-gains-losses', words: ['realized', 'realised', 'capital gains', 'gains and losses', 'gain/loss', 'tax gains'] },
  { id: 'asset-allocation-guidelines-graph', words: ['ips', 'guideline', 'guidelines', 'investment policy', 'policy compliance', 'compliance', 'drift', 'target allocation'] },
  { id: 'asset-allocation', words: ['allocation', 'asset mix', 'asset class', 'pie', 'breakdown', 'weighting'] },
  { id: 'evolution-of-exposures', words: ['evolution', 'over time', 'allocation history', 'changed over', 'how allocation'] },
  { id: 'portfolio-exposures', words: ['exposure', 'exposures', 'sector', 'geography', 'dimensions'] },
  { id: 'private-equity', words: ['private equity', 'irr', 'tvpi', 'dpi', 'commitment', 'paid-in', 'capital call'] },
  { id: 'portfolio-valuation', words: ['holdings', 'valuation', 'cost basis', 'unrealized', 'unrealised', 'book value', 'positions'] },
  { id: 'portfolio-reconciliation', words: ['reconciliation', 'reconcile', 'beginning to ending', 'period flows'] },
  { id: 'consolidated-activity', words: ['consolidated activity', 'activity summary', 'inflows', 'outflows', 'income summary'] },
  { id: 'transactions-fx', words: ['transaction fx', 'fx detail', 'foreign exchange', 'currency conversion'] },
  { id: 'transactions', words: ['transaction', 'transactions', 'trades', 'trade list', 'activity'] },
  { id: 'portfolio-overview', words: ['portfolio overview', 'money-weighted', 'money weighted', 'mwr', 'twr table', 'market value vs'] },
  { id: 'cumulative-returns', words: ['cumulative', 'since inception return', 'growth chart', 'monthly returns'] },
  { id: 'return-calendar-year', words: ['calendar year', 'calendar-year', 'annual return', 'yearly return'] },
  { id: 'trailing-returns', words: ['performance', 'return', 'returns', 'trailing', 'twr'] },
  { id: 'account-details-period-change', words: ['period change', 'change vs', 'vs prior', 'prior period'] },
  { id: 'account-overview', words: ['overview', 'summary', 'account summary', 'snapshot'] },
  { id: 'account-details', words: ['account details', 'details'] },
];

/** Match the best report type for a phrase, or undefined. */
export function matchReportType(text: string): string | undefined {
  const t = text.toLowerCase();
  let best: { id: string; score: number } | undefined;
  for (const { id, words } of REPORT_KEYWORDS) {
    const score = words.reduce((n, w) => (t.includes(w) ? n + 1 : n), 0);
    if (score > 0 && (!best || score > best.score)) best = { id, score };
  }
  return best && getReport(best.id) ? best.id : undefined;
}

/** Does the phrase ask for a benchmark comparison? */
export function wantsBenchmark(text: string): boolean {
  return /benchmark|vs\.?\s*(the\s*)?index|versus\s*(the\s*)?index|against\s*(the\s*)?index|relative to/i.test(text);
}

/** If a `<id>-benchmarks` sibling exists, return it; otherwise undefined. */
export function benchmarkSibling(reportTypeId: string): string | undefined {
  const sibling = `${reportTypeId}-benchmarks`;
  return getReport(sibling) ? sibling : undefined;
}

export function extractPeriod(text: string): string | undefined {
  const t = text.toLowerCase();
  // explicit tokens
  for (const p of PERIODS) {
    if (new RegExp(`\\b${p.toLowerCase().replace(/\s+/g, '\\s+')}\\b`).test(t)) return p;
  }
  if (/\b(q[1-4]|this quarter|quarter to date|quarter-to-date)\b/.test(t)) return 'QTD';
  if (/year to date|year-to-date|this year/.test(t)) return 'YTD';
  if (/last year|past year|trailing year|\b1\s*year\b|one year/.test(t)) return '1Y';
  if (/\b3\s*year|three year/.test(t)) return '3Y';
  if (/\b5\s*year|five year/.test(t)) return '5Y';
  if (/since inception|inception/.test(t)) return 'Since Inception';
  return undefined;
}

export function extractCurrency(text: string): string | undefined {
  const m = text.toLowerCase().match(/\b(cad|usd|eur|gbp)\b/);
  return m && CURRENCIES.includes(m[1].toUpperCase()) ? m[1].toUpperCase() : undefined;
}

const QUARTER_END: Record<string, string> = {
  q1: `${REPORTING_YEAR}-03-31`,
  q2: `${REPORTING_YEAR}-06-30`,
  q3: `${REPORTING_YEAR}-09-30`,
  q4: `${REPORTING_YEAR}-12-31`,
};

export function extractAsOfDate(text: string): string | undefined {
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  const q = text.toLowerCase().match(/\bq([1-4])\b/);
  if (q) return QUARTER_END[`q${q[1]}`];
  if (/year to date|year-to-date|this year|ytd/i.test(text)) return DEFAULT_AS_OF;
  return undefined;
}

export interface EntityMatch {
  entity?: string;
  accounts: string[];
  source?: 'household' | 'type' | 'member';
}

/** Resolve the report subject — whole household, an account type, or a member. */
export function extractEntity(text: string): EntityMatch {
  const t = text.toLowerCase();
  if (/household|family|consolidated|everything|all accounts/.test(t)) {
    return { entity: household.name, accounts: household.accounts.map((a) => a.id), source: 'household' };
  }
  // account type
  const typeAliases: { match: RegExp; type: string }[] = [
    { match: /rrsp/, type: 'RRSP' },
    { match: /tfsa/, type: 'TFSA' },
    { match: /non[- ]?reg|non[- ]?registered/, type: 'Non-Registered' },
    { match: /trust/, type: 'Trust' },
  ];
  for (const { match, type } of typeAliases) {
    if (match.test(t)) {
      const accts = household.accounts.filter((a) => a.type === type);
      if (accts.length) return { entity: `${type} accounts`, accounts: accts.map((a) => a.id), source: 'type' };
    }
  }
  // household member by first name
  for (const m of household.members) {
    const first = m.name.split(' ')[0].toLowerCase();
    if (first.length > 2 && new RegExp(`\\b${first}\\b`).test(t)) {
      const accts = household.accounts.filter((a) => a.owner === m.name);
      if (accts.length) return { entity: m.name, accounts: accts.map((a) => a.id), source: 'member' };
    }
  }
  return { accounts: [] };
}

/** Resolve "prepared for" by matching a contact name. */
export function extractPreparedFor(text: string): string | undefined {
  const t = text.toLowerCase();
  for (const c of contacts) {
    const first = c.name.split(' ')[0].toLowerCase();
    if (new RegExp(`\\b${first}\\b`).test(t)) return c.name;
  }
  return undefined;
}

/** A few common report types for quick-reply chips when none is chosen yet. */
export const QUICK_REPORT_PICKS = [
  'trailing-returns',
  'net-worth',
  'asset-allocation',
  'portfolio-valuation',
  'transactions',
].filter((id) => getReport(id));

export const allReportNames = reports.map((r) => r.name);
