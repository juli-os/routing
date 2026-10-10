// Pipeline ports: the engine owns state transitions; all transport details are
// injected. Every port is a plain object interface whose errors flow through
// Result — production wires tmux/SMTP/APNs, tests wire mocks.

import { createHash } from 'node:crypto';
import type { Result } from '../platform/shared/result.ts';
import type { JsonRecord } from '../platform/shared/json.ts';
import type { DeliverableRef, SweepEnvelope } from '@juli-os/artifacts';
import type { Step, Workflow } from './entities.ts';

// ---- LLM --------------------------------------------------------------------

export interface CompletionRequest {
  readonly system: string;
  readonly user: string;
  readonly maxTokens: number;
  /** Per-step model override (empty = engine-wide model). */
  readonly model?: string;
  readonly signal?: AbortSignal;
}

export interface CompletionResult {
  readonly text: string;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  /** Cache-hit tokens under z.ai billing semantics (wf_66a9b632154d):
   * cached_tokens, a subset of input_tokens — hit rate = cached/input. */
  readonly cachedTokens?: number;
}

export interface LlmPort {
  complete(req: CompletionRequest): Promise<Result<CompletionResult, Error>>;
}

// ---- Email -------------------------------------------------------------------

/** Inbound email (trigger payload). date is RFC3339. */
export interface EmailMessage {
  readonly from: string;
  /** Sender display name (RFC2047-decoded, e.g. "Chen Yifang") — one of the only
   * legitimate sources for a salutation; the ingest layer once dropped this
   * whole field (2026-10-01 hallucinated-name incident: the agent saw only the
   * address and was forced to invent a name). */
  readonly fromName?: string;
  readonly to: string;
  readonly subject: string;
  readonly body: string;
  readonly messageId: string;
  readonly date: string;
  readonly uid: number | string;
  readonly attachments: readonly { readonly name: string; readonly bytes: number; readonly content?: Buffer }[];
  /** Thread chain root (causal anchor across runs); intake stores it in meta
   * and resolves the linked workflow. */
  readonly inReplyTo?: string;
  readonly references?: string;
  /** Raw RFC 822 (for bucket archiving; may be absent on the envelope path). */
  readonly raw?: Buffer;
}

/** Dedup key (aligned with Go inbox.DedupKey): Message-ID first; otherwise a
 * stable hash with the nosuchid- prefix (guard against ID-less mail plus the
 * per-connection \Seen re-delivery flood). */
export const dedupKey = (m: EmailMessage): string => {
  if (m.messageId !== '') return m.messageId;
  const sum = createHash('sha1').update(`${m.from}|${m.subject}|${m.date}`).digest('hex');
  return `nosuchid-${sum.slice(0, 8)}`;
};

export const DEDUP_META_KEY = 'dedup_key';

// ---- Outbound mail ------------------------------------------------------------

export interface MailSendCommand {
  readonly to: string;
  readonly subject: string;
  readonly body: string;
  /** Client-visible rendered version (the multipart/alternative html part);
   * the text part is the unchanged approval text. */
  readonly html?: string;
  readonly inReplyTo: string;
  /** Carbon copy (breakpoint ten: declared in the gate manifest's envelope.cc,
   * the seed flows into the send step). bcc is unsupported (round-5 review:
   * dead field removed — envelope/manifest never produced bcc, and fake
   * support only breeds "thought it was blind-copied but wasn't" silent-drop
   * confusion; if blind copy is genuinely needed, introduce parsing+seeding+
   * display for it wholesale, the same way as cc). */
  readonly cc?: readonly string[];
  /** Attachments declared by the delivery contract (artifact bytes; claiming
   * "see attachment" must actually attach — 0913 incident). */
  readonly attachments?: readonly { readonly name: string; readonly bytes: Buffer }[];
}

export interface MailerPort {
  send(cmd: MailSendCommand): Promise<Result<{ readonly messageId: string }, Error>>;
}

// ---- agent dispatch -----------------------------------------------------------

/** Async dispatch (tmux path): returns as soon as sent; completion is settled
 * by hook/OnAgentStopped. */
export interface DispatcherPort {
  dispatch(source: string, session: string, text: string): Promise<Result<void, Error>>;
}

/** Sync dispatch (ACP/protocol-level completion path): blocks until the turn
 * ends and returns the final message. */
export interface SyncDispatcherPort {
  dispatchSync(source: string, session: string, text: string): Promise<Result<string, Error>>;
}

// ---- Push ---------------------------------------------------------------------

/** Gate/completion/failure notifications. Best effort: a push failure must
 * never block gate state itself. */
export interface PusherPort {
  gateWaiting(w: Workflow, st: Step, summary: string): Promise<void>;
  workflowDone(w: Workflow, summary: string): Promise<void>;
  /** Proactive push for guarded workflow failures (e.g. completion blocked on
   * zero steps): the whole point of the guard is manual handling — without the
   * notification, that handling loop never gets started. */
  workflowFailed(w: Workflow, summary: string): Promise<void>;
  /** Proactive push for a dangling chain tail (all nodes terminal and no send
   * step ever ran). Optional method: the engine calls it best-effort inside
   * try/catch; mocks must not blow up when it is missing. */
  chainDangling?(w: Workflow, note: string): Promise<void>;
  /** Immediate push on step failure (2026-09-15 breakpoint 11-①): after an
   * agent/send step fails, the chain stalls silently until someone shouts
   * "continue" — failures must make noise. Optional like chainDangling: the
   * engine calls it best-effort (failures only logged), mocks must not blow
   * up when it is missing. */
  stepFailed?(w: Workflow, st: Step, reason: string): Promise<void>;
  /** Settleable chain-tail hint (2026-09-23 breakpoint ③): all nodes terminal
   * and nobody settled — the run sits silently at the chain tail waiting to be
   * closed out. "Time to settle" no longer depends on a human remembering.
   * Same optional shape; per the established division of labor, device pushes
   * are not expanded — this goes via email/in-app. */
  settleHint?(w: Workflow, note: string): Promise<void>;
  /** Agent awaiting input (2026-09-28 stuck-on-question fix): the session's
   * agent is waiting for a human to answer at the terminal (permission/choice/
   * question) — not a zombie but waiting for a person; the watchdog exemption
   * goes through notifications instead. Optional, same shape as settleHint. */
  awaitingInput?(w: Workflow, st: Step, note: string): Promise<void>;
}

// ---- Session delivery ---------------------------------------------------------

/** Result of delivering a first-class interjection/backflow into a tmux
 * session: delivered = the text reached the session input (including the
 * in_box queued form for a busy session — CC consumes it at turn end, not a
 * failure). On failure, reason must be a human-readable cause (session
 * missing / send-keys failed / paste lost); a blanket "delivery failed" is
 * not allowed (2026-09-23 interjection 400 incident: a 20s confirmation
 * timeout was turned into a cause-less 400, leaving debugging to guesswork). */
export interface SessionDelivery {
  readonly delivered: boolean;
  readonly reason: string;
  /** Arrival form: cleared = submitted / input box reset; in_box = queued in
   * a busy session awaiting consumption. */
  readonly finalState?: 'cleared' | 'in_box';
}

// ---- Artifact sweep -----------------------------------------------------------

/** Sweep outcome: registered deliverable pointers + the manifest envelope.
 * Data source for step output.deliverables; deliverables only holds artifacts
 * for human review (the manifest itself lands in meta with manifest=true, not
 * in entries). The pointer shape reuses the ledger's DeliverableRef — single
 * declaration. */
export interface SweepOutcome {
  readonly count: number;
  readonly entries: readonly DeliverableRef[];
  readonly envelope: SweepEnvelope | null;
  readonly warnings: readonly string[];
  readonly has_manifest: boolean;
}

/** Artifact port (engine's view): manifest-verified sweep, registration, and
 * fetch-by-hash. */
export interface ArtifactPort {
  readonly putAndRegister?: (r: {
    workflowId: string; role: string; name: string; bytes: Buffer;
    stepId?: string; meta?: JsonRecord;
  }) => Promise<{ id: string; sha256: string }>;
  readonly list: (workflowId: string) => readonly {
    readonly id: string; readonly name: string; readonly key: string;
    readonly stepId: string;
    readonly deletedAt: string | null; readonly meta: JsonRecord;
  }[];
  readonly updateMeta: (id: string, patch: JsonRecord) => void;
  /** Fetch registered content by id (retrieval entry for the send step):
   * bytes + hash verification data. */
  readonly getContent?: (id: string) => Promise<{ bytes: Buffer; sha256: string; name: string; viewRole: string } | null>;
  readonly sweepCaseInbox: (workflowId: string, stepId?: string) => Promise<SweepOutcome>;
}

// ---- Semantic judgment (Jev/System One, pluggable) -----------------------------

/** Judgment scenarios (the granularity of the fine-grained switches): each
 * scenario can be independently off/shadow/on (judgment.json). */
export type JudgmentScenario =
  | 'route_intake'    // First hop of email intake: content judgment picks which declared session (rule leg demoted to fallback)
  | 'route_fallback'  // Routing fallback leg: pick a declared session when the rule chain misses entirely
  | 'intake_gate'     // Case-value judgment: is this intake worth opening a case
  | 'align_needed'    // Alignment-necessity pre-screen (reserved)
  | 'aggregate_same'  // Feedback same-root-cause aggregation (reserved)
  | 'handoff_domain'  // Handoff domain judgment (reserved)
  | 'output_quality'  // Output-quality pre-check (reserved)
  | 'redline_semantic'// Red-line semantic review (reserved)
  | 'triage_classify' // Email triage: typed judgment for category/needs_reply (summary stays with the LLM)
  | 'mount_infer'     // Feedback mount inference (reserved)
  | 'alert_grade';    // Alert grading for noise reduction (reserved)

/** Runtime mirror of the full scenario set (judgment.json is a human-edited
 * hot-read surface — misspelled scenario keys must be recognized and dropped,
 * otherwise "thought shadow data was accumulating while that scenario never
 * went out to the network" yields zero feedback; the annotation pins
 * isomorphism with the union type, so drift fails compilation here). */
export const JUDGMENT_SCENARIOS: readonly JudgmentScenario[] = [
  'route_intake', 'route_fallback', 'intake_gate', 'align_needed', 'aggregate_same', 'handoff_domain',
  'output_quality', 'redline_semantic', 'triage_classify', 'mount_infer', 'alert_grade',
];

/** Judgment question (minimal structural shape — contracts must not depend on
 * business/routing's JevQuestion; this is structurally compatible with it, and
 * the provider contract defines the concrete semantics of instructions/criteria):
 * noul = a yes/no question as a 0-1 probability (**polarity = P(answer is
 * yes)**, pinned in plan.ts); choice = options + probabilities. */
export type JudgmentQuestion =
  | { readonly type: 'noul'; readonly instructions: unknown; readonly criteria?: unknown }
  | { readonly type: 'choice'; readonly instructions: unknown; readonly criteria: unknown };

/** Judgment gateway (consumers only know this interface): mode adjudication
 * lives in the gateway (off returns null outright, no network); shadow =
 * judgment runs and is recorded but the result has no effect; on = the result
 * may be adopted by consumers (who must still validate the answer against
 * engine-side rules — "typed judgment is input only; decisions stay in the
 * engine"). */
export interface JudgmentGateway {
  /** Adoption threshold (config.min_confidence, a **single global value**,
   * default 0.7): in on mode, consumers must reject answers whose confidence
   * is below it (degrade to default behavior). No per-scenario parameter —
   * off/shadow/on is per scenario, the threshold is not; do not misread it as
   * configurable per scenario. */
  threshold(): number;
  /** Run a judgment. off → null (the caller skips at zero cost); the gateway
   * never throws — network/config failures degrade to an error outcome and
   * the consumer falls back to default behavior (a dead jev must not take
   * the pipeline down). */
  ask(scenario: JudgmentScenario, state: unknown, questions: Readonly<Record<string, JudgmentQuestion>>):
    Promise<JudgmentOutcome | null>;
}

export interface JudgmentOutcome {
  readonly mode: 'shadow' | 'on';
  readonly ok: boolean;
  /** Adoption threshold adjudicated from the config used for this judgment:
   * same source and same load as mode — consumers treat this as authoritative
   * and must not re-read config themselves (closing the TOCTOU window where
   * hot edits land between reads). */
  readonly threshold: number;
  /** Judgment result when ok=true (the choice option / 'true'/'false' mapped
   * from the noul 0-1 probability). */
  readonly answer?: string;
  readonly confidence?: number;
  readonly probabilities?: Readonly<Record<string, number>>;
  /** Full answer set for multi-question asks (key = question key; values are
   * shaped like answer/confidence). Single-question consumers may ignore it;
   * the legacy top-level answer/confidence always equals the answer to the
   * **first question** (compatible with the two existing consumers).
   * triage_classify asks multiple questions per call (category+needs_reply)
   * via this. */
  readonly answers?: Readonly<Record<string, { readonly answer?: string; readonly confidence?: number }>>;
  readonly provider: string;
  readonly error?: string;
  /** Usage receipt (input to the cost ledger): real usage from the judgment
   * response when ok=true; absent on failure/off. Consumers may pass it
   * through into audited events for later analysis. */
  readonly model?: string;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  /** Cache-hit tokens under z.ai billing semantics (wf_66a9b632154d):
   * cached_tokens, a subset of input_tokens — hit rate = cached/input. */
  readonly cachedTokens?: number;
  readonly durationMs?: number;
}
