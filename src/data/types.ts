/** Shared domain types for the Reporting app. */

export type ReportCategoryId =
  | 'summary'
  | 'net-worth'
  | 'performance'
  | 'exposure'
  | 'activity'
  | 'holdings'
  | 'transactions'
  | 'tax';

export interface ReportCategory {
  id: ReportCategoryId;
  /** "Category 1 — Summary Reports" style number for display. */
  index: number;
  name: string;
  description: string;
}

/** The visual layout a report viewer should render for a given report. */
export type ReportLayout =
  | 'table' // single grouped/subtotalled table
  | 'flows-table' // beginning → flows → ending table
  | 'balance-sheet' // net worth columnar statement
  | 'line-and-table' // line chart + trailing/stats table
  | 'returns-grid' // monthly/calendar/trailing returns matrix
  | 'pie-and-table' // allocation pie + table
  | 'guidelines' // actual vs target/min/max (optional bar)
  | 'stacked-evolution' // stacked bars over time + table
  | 'multi-pie' // several grouping dimensions side by side
  | 'multi-section' // CRM2 / Consolidated Activity style sections
  | 'transactions'; // line-by-line transaction list

export interface ReportType {
  id: string;
  name: string;
  category: ReportCategoryId;
  /** "How it is created" — short description of the run. */
  howCreated: string;
  /** Data inputs required to run the report. */
  dataRequired: string[];
  /** Output columns / metrics description. */
  output: string;
  /** Available variants (Consolidated / By Account / etc.). */
  variants: string[];
  /** Layout used by the sample renderer. */
  layout: ReportLayout;
  /** Whether the report is period-based (needs a start date) or point-in-time. */
  periodBased: boolean;
  /** Whether the report includes one or more charts. */
  hasChart: boolean;
}

export interface SavedTemplate {
  id: string;
  title: string;
  reportTypeId: string;
  accounts: string; // household / client / account label
  preparedFor: string;
  preparedBy: string[];
  reportingCurrency: string;
  period?: string;
  sections: string[];
  documentVault: boolean;
  updatedAt: string; // ISO date
  /** Firm-standard (admin-published, locked) vs an advisor's own template. */
  scope: 'firm' | 'advisor';
  /** Who owns it — an advisor name, or "Compliance" for firm templates. */
  owner?: string;
}

export interface GeneratedReport {
  id: string;
  title: string;
  reportTypeId: string;
  account: string;
  asOfDate: string;
  generatedAt: string; // ISO datetime
  preparedBy: string;
}
