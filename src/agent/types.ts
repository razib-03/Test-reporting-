import { DEFAULT_AS_OF, DEFAULT_SECTIONS } from './constants';

/**
 * The structured report configuration the agent assembles from a conversation.
 * A superset of the TemplateBuilder form state; maps cleanly onto SavedTemplate.
 * Fields prefixed with `_` are internal conversation state, not part of the template.
 */
export interface ReportConfigDraft {
  reportTypeId?: string;
  title?: string;
  period?: string;
  currency: string;
  nativeCurrency: boolean;
  accounts: string[]; // account IDs
  entity?: string; // human label of the selected subject (household or account)
  preparedFor?: string;
  attention?: string;
  preparedBy: string[];
  asOfDate: string;
  sections: string[];
  documentVault: boolean;
  /** Set once the benchmark question has been resolved (chosen or declined). */
  _benchmarkResolved?: boolean;
}

export interface QuickReply {
  label: string;
  /** Text fed back through the agent as if the user typed it. */
  value: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  quickReplies?: QuickReply[];
}

export interface AgentTurn {
  draft: ReportConfigDraft;
  message: AgentMessage;
  /** True when every required field for the chosen report type is populated. */
  ready: boolean;
}

/**
 * Pluggable agent contract. The shipped implementation is deterministic and
 * offline; a real Claude-backed agent (single structured-output call on
 * claude-opus-4-8) can implement the same interface later.
 */
export interface ConfigAgent {
  interpret(userText: string, draft: ReportConfigDraft): AgentTurn | Promise<AgentTurn>;
  starterPrompts(): string[];
}

export function emptyDraft(): ReportConfigDraft {
  return {
    currency: 'CAD',
    nativeCurrency: false,
    accounts: [],
    preparedBy: [],
    asOfDate: DEFAULT_AS_OF,
    sections: [...DEFAULT_SECTIONS],
    documentVault: false,
  };
}
