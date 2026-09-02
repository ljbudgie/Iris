export const LOOP_TYPES = [
  "insufficiency",
  "circular_referral",
  "precondition_stacking",
  "template_dismissal",
  "identity_loop",
  "channel_redirect",
] as const;

export type LoopType = (typeof LOOP_TYPES)[number];

export type LoopDirection = "institution" | "individual";

export type LoopMessageInput = {
  date: string;
  sender: string;
  content_summary: string;
  direction?: LoopDirection | string;
  reference?: string;
};

export type ClassifyThreadInput = {
  messages: LoopMessageInput[];
  institution?: string | null;
  named_individual?: string | null;
};

export type LoopFinding = {
  schema_version: 1;
  loop_detected: boolean;
  loop_type: LoopType | null;
  loop_count: number;
  days_consumed: number;
  institution: string;
  named_individual: string | null;
  correspondence_refs: string[];
  accountability_finding: "SOVEREIGN" | "NULL";
  summary: string;
  provisional: true;
  requires_human_confirmation: true;
  disclaimer: string;
};
