import { getReport } from '@/data/reportCatalog';
import { household, contacts, advisors } from '@/data/clients';
import type { SavedTemplate, GeneratedReport, ReportType } from '@/data/types';
import type { AgentTurn, ConfigAgent, QuickReply, ReportConfigDraft } from './types';
import {
  matchReportType,
  wantsBenchmark,
  benchmarkSibling,
  extractPeriod,
  extractCurrency,
  extractAsOfDate,
  extractEntity,
  extractPreparedFor,
  QUICK_REPORT_PICKS,
} from './intentParser';

let seq = 0;
const msgId = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

const NEGATE = /\b(no|without|skip|don'?t|do not|none)\b/i;

// ── Quick-reply sets ───────────────────────────────────────────────────────
const reportPicks = (): QuickReply[] =>
  QUICK_REPORT_PICKS.map((id) => ({ label: getReport(id)!.name, value: getReport(id)!.name }));

const periodPicks = (): QuickReply[] =>
  ['QTD', 'YTD', '1Y', 'Since Inception'].map((p) => ({ label: p, value: p }));

const entityPicks = (): QuickReply[] => [
  { label: 'Whole household', value: 'the whole household' },
  ...household.members
    .filter((m) => household.accounts.some((a) => a.owner === m.name))
    .map((m) => ({ label: m.name.split(' ')[0], value: m.name.split(' ')[0] })),
];

const preparedForPicks = (): QuickReply[] =>
  contacts.map((c) => ({ label: c.name.split(' ')[0], value: c.name }));

const benchmarkPicks = (): QuickReply[] => [
  { label: 'Yes — add benchmark', value: 'yes, add the benchmark comparison' },
  { label: 'No benchmark', value: 'no, skip the benchmark' },
];

// ── Merge a user phrase into the draft ───────────────────────────────────────
function merge(userText: string, draft: ReportConfigDraft): ReportConfigDraft {
  const next: ReportConfigDraft = { ...draft };

  const rt = matchReportType(userText);
  if (rt) {
    next.reportTypeId = rt;
    next._benchmarkResolved = false; // re-evaluate benchmark for the new report
  }

  // Benchmark intent — handles "vs benchmark" and the yes/no answer alike.
  if (next.reportTypeId && !next._benchmarkResolved) {
    const declined = NEGATE.test(userText) && /benchmark/i.test(userText);
    if (declined) {
      next._benchmarkResolved = true;
    } else if (wantsBenchmark(userText)) {
      const sib = benchmarkSibling(next.reportTypeId);
      if (sib) next.reportTypeId = sib;
      next._benchmarkResolved = true;
    }
  }

  const period = extractPeriod(userText);
  if (period) next.period = period;

  const currency = extractCurrency(userText);
  if (currency) next.currency = currency;

  const asOf = extractAsOfDate(userText);
  if (asOf) next.asOfDate = asOf;

  const em = extractEntity(userText);
  // Don't let a member name in a later answer clobber an already-chosen subject.
  if (em.entity && (em.source !== 'member' || !draft.entity)) {
    next.entity = em.entity;
    next.accounts = em.accounts;
  }

  const recipient = extractPreparedFor(userText);
  if (recipient) {
    next.preparedFor = recipient;
    if (!next.attention) next.attention = recipient;
  }

  // Auto-title once a report is known.
  if (next.reportTypeId && !next.title) {
    const r = getReport(next.reportTypeId);
    if (r) next.title = `${r.name} — ${next.entity ?? household.name}`;
  }

  return next;
}

// ── Decide the next clarifying question ──────────────────────────────────────
type Question = { text: string; quickReplies: QuickReply[] } | null;

function nextQuestion(draft: ReportConfigDraft): Question {
  if (!draft.reportTypeId) {
    return { text: 'What would you like to report on? Describe it, or pick one:', quickReplies: reportPicks() };
  }
  const report = getReport(draft.reportTypeId)!;
  if (report.periodBased && !draft.period) {
    return { text: 'Which period should it cover?', quickReplies: periodPicks() };
  }
  if (draft.accounts.length === 0) {
    return { text: 'Which accounts — the whole household, or someone specific?', quickReplies: entityPicks() };
  }
  if (!draft.preparedFor) {
    return { text: 'Who should it be prepared for?', quickReplies: preparedForPicks() };
  }
  if (benchmarkSibling(report.id) && !draft._benchmarkResolved) {
    return { text: `${report.name} can include a benchmark comparison. Add one?`, quickReplies: benchmarkPicks() };
  }
  return null;
}

/** True when no clarifying question remains — used after manual edits too. */
export function isDraftReady(draft: ReportConfigDraft): boolean {
  return nextQuestion(draft) === null;
}

// ── Natural-language summary of what's captured ──────────────────────────────
function summarize(draft: ReportConfigDraft, report: ReportType): string {
  const parts = [`**${report.name}**`];
  if (report.periodBased && draft.period) parts.push(draft.period);
  if (draft.entity) parts.push(draft.entity);
  if (draft.preparedFor) parts.push(`prepared for ${draft.preparedFor}`);
  if (draft.currency && draft.currency !== 'CAD') parts.push(`in ${draft.currency}`);
  return parts.join(', ');
}

// ── The simulated agent ──────────────────────────────────────────────────────
export const simulatedConfigAgent: ConfigAgent = {
  interpret(userText, draft) {
    const next = merge(userText, draft);
    const report = next.reportTypeId ? getReport(next.reportTypeId) : undefined;
    const q = nextQuestion(next);

    let lead = '';
    if (report) lead = `Setting up ${summarize(next, report)}. `;
    else lead = "I can help configure a report. ";

    const text = q
      ? lead + q.text
      : `${lead}Everything's set — review the preview on the right, then Generate & Download or Save as a template. Want to change anything?`;

    const turn: AgentTurn = {
      draft: next,
      message: { id: msgId(), role: 'agent', text, quickReplies: q?.quickReplies },
      ready: !q,
    };
    return turn;
  },

  starterPrompts() {
    return [
      'Net worth statement for the household',
      'YTD performance vs benchmark for Daniel',
      "This year's transactions, by account",
      'CRM2 annual fee disclosure',
      'Asset allocation vs IPS guidelines',
    ];
  },
};

// ── Draft → persistable shapes ──────────────────────────────────────────────
export function draftToTemplate(draft: ReportConfigDraft): SavedTemplate {
  const report = draft.reportTypeId ? getReport(draft.reportTypeId) : undefined;
  return {
    id: `tpl-${Date.now()}`,
    title: draft.title || report?.name || 'Untitled report',
    reportTypeId: draft.reportTypeId ?? '',
    accounts: draft.entity ?? household.name,
    preparedFor: draft.preparedFor ?? contacts[0].name,
    preparedBy: draft.preparedBy.length ? draft.preparedBy : [advisors[0].name],
    reportingCurrency: draft.currency,
    period: report?.periodBased ? draft.period : undefined,
    sections: draft.sections,
    documentVault: draft.documentVault,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

export function draftToGenerated(draft: ReportConfigDraft): GeneratedReport {
  const report = draft.reportTypeId ? getReport(draft.reportTypeId) : undefined;
  return {
    id: `gen-${Date.now()}`,
    title: draft.title || report?.name || 'Untitled report',
    reportTypeId: draft.reportTypeId ?? '',
    account: draft.entity ?? household.name,
    asOfDate: draft.asOfDate,
    generatedAt: new Date().toISOString(),
    preparedBy: draft.preparedBy[0] ?? advisors[0].name,
  };
}
