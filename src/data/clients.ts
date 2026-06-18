/** Mock household used as the subject of every sample report. */

export interface Account {
  id: string;
  name: string;
  type: string; // RRSP, TFSA, Non-Registered, etc.
  owner: string; // household member name
  currency: string;
  inceptionDate: string;
  marketValue: number; // in CAD
  priorMarketValue: number; // prior period MV in CAD
  custodian: string;
}

export interface HouseholdMember {
  name: string;
  relationship: string;
}

export interface Household {
  id: string;
  name: string;
  advisor: string;
  reportingCurrency: string;
  members: HouseholdMember[];
  accounts: Account[];
}

export const household: Household = {
  id: 'hh-okafor',
  name: 'Okafor Family Household',
  advisor: 'Sarah Mitchell',
  reportingCurrency: 'CAD',
  members: [
    { name: 'Daniel Okafor', relationship: 'Primary' },
    { name: 'Amara Okafor', relationship: 'Spouse' },
    { name: 'Okafor Family Trust', relationship: 'Trust' },
  ],
  accounts: [
    { id: 'AC-10021', name: 'Daniel Okafor — RRSP', type: 'RRSP', owner: 'Daniel Okafor', currency: 'CAD', inceptionDate: '2014-03-12', marketValue: 1284500, priorMarketValue: 1198200, custodian: 'NBIN' },
    { id: 'AC-10022', name: 'Daniel Okafor — TFSA', type: 'TFSA', owner: 'Daniel Okafor', currency: 'CAD', inceptionDate: '2016-01-08', marketValue: 142300, priorMarketValue: 131900, custodian: 'NBIN' },
    { id: 'AC-10023', name: 'Daniel Okafor — Non-Reg', type: 'Non-Registered', owner: 'Daniel Okafor', currency: 'USD', inceptionDate: '2012-09-21', marketValue: 968750, priorMarketValue: 1011400, custodian: 'Fidelity Clearing' },
    { id: 'AC-10031', name: 'Amara Okafor — RRSP', type: 'RRSP', owner: 'Amara Okafor', currency: 'CAD', inceptionDate: '2015-06-02', marketValue: 712900, priorMarketValue: 668500, custodian: 'NBIN' },
    { id: 'AC-10032', name: 'Amara Okafor — TFSA', type: 'TFSA', owner: 'Amara Okafor', currency: 'CAD', inceptionDate: '2017-02-14', marketValue: 98640, priorMarketValue: 91200, custodian: 'NBIN' },
    { id: 'AC-10041', name: 'Okafor Family Trust', type: 'Trust', owner: 'Okafor Family Trust', currency: 'CAD', inceptionDate: '2018-11-30', marketValue: 2340000, priorMarketValue: 2255000, custodian: 'RBC I&TS' },
  ],
};

export const totalMarketValue = household.accounts.reduce((s, a) => s + a.marketValue, 0);
export const totalPriorMarketValue = household.accounts.reduce((s, a) => s + a.priorMarketValue, 0);

/** A representative single account/portfolio used by performance reports. */
export const focusPortfolio = {
  name: 'Okafor Family — Consolidated Portfolio',
  inceptionDate: '2012-09-21',
  marketValue: totalMarketValue,
  benchmarkName: '60/40 Global Balanced Index',
};

/** Contacts used for "Prepared For" on cover pages. */
export const contacts = [
  { id: 'c1', name: 'Daniel Okafor', address: '418 Sherbourne St, Toronto, ON M4X 1K2' },
  { id: 'c2', name: 'Amara Okafor', address: '418 Sherbourne St, Toronto, ON M4X 1K2' },
];

/** Internal users used for "Prepared By". */
export const advisors = [
  { id: 'u1', name: 'Sarah Mitchell', title: 'Senior Wealth Advisor' },
  { id: 'u2', name: 'James Chen', title: 'Associate Advisor' },
];

/** A client/household in the advisor's book — used to apply a template to many at once. */
export interface Client {
  id: string;
  name: string;
  advisor: string;
  kind: 'household' | 'individual';
  aum: number;
}

/** The advisor's book of business (Okafor is the household reports render against). */
export const clients: Client[] = [
  { id: household.id, name: household.name, advisor: 'Sarah Mitchell', kind: 'household', aum: totalMarketValue },
  { id: 'hh-tremblay', name: 'Tremblay Family Household', advisor: 'Sarah Mitchell', kind: 'household', aum: 3120400 },
  { id: 'hh-nakamura', name: 'Nakamura Household', advisor: 'Sarah Mitchell', kind: 'household', aum: 1894250 },
  { id: 'ind-okonkwo', name: 'Grace Okonkwo', advisor: 'Sarah Mitchell', kind: 'individual', aum: 742900 },
  { id: 'hh-rossi', name: 'Rossi Family Trust', advisor: 'James Chen', kind: 'household', aum: 5410000 },
  { id: 'ind-patel', name: 'Anil Patel', advisor: 'James Chen', kind: 'individual', aum: 988600 },
  { id: 'hh-lefebvre', name: 'Lefebvre Household', advisor: 'James Chen', kind: 'household', aum: 2267300 },
  { id: 'ind-osei', name: 'Kwame Osei', advisor: 'Sarah Mitchell', kind: 'individual', aum: 531200 },
];
