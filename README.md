# Reporting · by Purpose

An advisor-facing reporting application modeled on the **d1g1t reporting catalog** — the full set of 21 report types across 8 categories, plus the two-step *configure template → generate report* workflow.

## Stack

- React 18 + Vite 6 + TypeScript
- Tailwind CSS v4 (EOL Advisor Centre light theme — Work Sans, `#0645ad` primary)
- React Router v7
- Recharts (line / pie / stacked-bar / horizontal-bar)
- lucide-react icons

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173 (or next free port)
npm run build    # tsc -b && vite build
npm run preview  # serve the production build
```

## What's inside

| Route | Page |
|---|---|
| `/` | **Dashboard** — metrics, recent reports, category grid, quick actions |
| `/library` | **Report Library** — browse all 21 report types, search + category filters |
| `/library/:reportId` | **Report Viewer** — metadata + rendered sample report (charts + tables) |
| `/templates` | **Templates** — saved report templates |
| `/templates/new`, `/templates/:id` | **Template Builder** — Step 1: configure a template |
| `/generate` | **Generate Report** — Step 2: on-demand generation |

### Report catalog (8 categories)

1. **Summary** — Account Details, Account Details w/ Period Change, Account Overview
2. **Net Worth** — Net Worth (Statement / Estate)
3. **Performance** — Cumulative Returns, Portfolio Overview, Return – Calendar Year (±benchmarks), Trailing Returns (±benchmarks)
4. **Exposure & Allocation** — Asset Allocation, Allocation Guidelines (table / graph), Evolution of Exposures, Portfolio Exposures
5. **Portfolio Activity** — Portfolio Reconciliation
6. **Holdings** — Portfolio Valuation, Private Equity, Valuation
7. **Transactions** — Consolidated Activity, Transactions, Transactions w/ FX
8. **Canadian Tax & Regulatory** — CRM2, Foreign Property (T1135), Realized Gains and Losses

All reports render against a shared mock household (the **Okafor Family Household**) with deterministic sample data defined in `src/data/`.

## Project layout

```
src/
  data/        report catalog, types, mock household, sample report datasets, templates
  components/
    layout/    AppLayout, Sidebar
    report/    ReportShell (cover frame), ReportRenderer (layout switch)
  pages/       Dashboard, Library, ReportViewer, Templates, TemplateBuilder, Generate
  lib/         cn() + formatting helpers
  styles/      Tailwind v4 + theme tokens (Work Sans, EOL palette)
```

> All data is mock — there is no backend. This is a UI prototype of the d1g1t reporting experience.
