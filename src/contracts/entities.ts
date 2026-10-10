// Domain types for the lifecycle ledger. Everything readonly: state
// transitions = explicit functions writing to the store (the store is the
// only mutable boundary); in-memory objects are never mutated in place.
// Column-for-column aligned with Go internal/ledger/lifecycle (migration V1),
// so in-flight data can be read from both sides.

import type { JsonRecord } from '../platform/shared/json.ts';

export type WorkflowStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'rejected';
/** Terminal statuses: entering one cascades a close-out of in-flight runs
 * (queued/running are both non-terminal, no close-out). */
export const TERMINAL_WORKFLOW_STATUSES: readonly WorkflowStatus[] = [
  'completed', 'failed', 'cancelled', 'rejected',
];
export type StepStatus = 'pending' | 'running' | 'waiting_human' | 'completed' | 'failed' | 'cancelled' | 'skipped';
export type StepKind = 'triage' | 'gate' | 'agent' | 'verify' | 'draft' | 'send' | 'llm' | 'share';

export const STEP_KINDS: readonly StepKind[] = [
  'triage', 'gate', 'agent', 'verify', 'draft', 'send', 'llm', 'share',
];

// ---- step kind capability sets (consolidated 2026-09-22) --------------------
// The verb surfaces (intervene/rework/retry-patch/reworkSend) previously each
// hand-wrote their own kind sets, consistent only by coincidence. The sets are
// semantics, not a bug: intervene/rework only accept steps that truly run an
// agent; the instruction-bearing surface is wider (llm/draft also take
// plan/prompt). New kinds join exactly one set here.

/** Steps that run an agent (intervenable/reworkable/counted as "doing work"):
 * five engine sites (intervene/align/reworkSend/assignSession) plus the two
 * SQL paths in store.runningAgentStepForSession share this set (the SQL
 * consumes it via sqlInList). */
export const AGENT_STEP_KINDS: readonly StepKind[] = ['agent', 'verify'];

/** Steps that can carry instruction patches (plan/prompt/session): the engine
 * rework rescan and retry patch share this set (llm/draft also take
 * instructions, but cannot be interjected into). */
export const INSTRUCTABLE_STEP_KINDS: readonly StepKind[] = ['agent', 'verify', 'llm', 'draft'];

export interface Workflow {
  readonly id: string;
  readonly parentId: string | null;
  readonly kind: string;
  readonly title: string;
  readonly status: WorkflowStatus;
  readonly session: string;
  readonly project: string;
  readonly path: string;
  /** First-class conversation (thread) modeling: the thread id shared by all
   * email exchanges in one conversation. null = a historical row predating
   * this column or a non-email case. Thread root = the first email's own
   * workflow id. */
  readonly threadId: string | null;
  readonly meta: JsonRecord;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Step {
  readonly id: string;
  readonly workflowId: string;
  readonly seq: number; // 1-based
  readonly kind: StepKind;
  readonly title: string;
  readonly status: StepStatus;
  readonly input: JsonRecord;
  readonly output: JsonRecord;
  readonly summary: string;
  readonly updatedAt: string;
  /** Node timing: the first transition out of pending (a gate's
   * waiting_human also counts as started). Empty string = a historical row
   * (before the backfill migration) or not started yet. */
  readonly startedAt: string;
  /** First time a terminal status was reached; null = not terminal yet or a
   * historical row. */
  readonly completedAt: string | null;
}

export interface LedgerEvent {
  readonly id: number;
  /** 'agent' = session runtime telemetry (skill_used etc., entityId =
   * session name) — like judgment, an audit record with no workflow entity;
   * first used 2026-10-02 for skill tracing. */
  readonly entityType: 'workflow' | 'step' | 'judgment' | 'agent';
  readonly entityId: string;
  readonly type: string;
  readonly payload: JsonRecord;
  readonly ts: string;
}

export interface Run {
  readonly id: string;
  readonly workflowId: string;
  readonly session: string;
  readonly status: 'running' | 'idle' | 'completed' | 'failed';
  readonly createdAt: string;
}

export interface Prompt {
  readonly id: string;
  readonly runId: string;
  readonly content: string;
  readonly status: 'submitted' | 'completed' | 'failed';
  readonly createdAt: string;
}

/** Task projection (phase-4 minimal promotion, 2026-09-22): Task adds no new
 * table — the "task card" is an adhoc case with meta.mode='nodes' (created by
 * engine.startTask), and attached cases link via meta.related_workflow (with
 * parent_id as fallback). One Task = the task card + every workflow on the
 * chain attributed to it (including email cases / follow-up execution
 * cases). */
export interface TaskView {
  /** The task card's workflow id (= Task id). */
  readonly taskId: string;
  readonly title: string;
  /** The task card's own status (WorkflowStatus). */
  readonly status: WorkflowStatus;
  /** All workflow ids attributed to this Task (including the task card
   * itself), newest → oldest. */
  readonly workflowIds: readonly string[];
}
