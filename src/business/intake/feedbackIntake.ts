import type { FbRecord } from './feedbackMirror.ts';
// Intake port (stub) — pure routing-rule lookup peeled alongside the routing
// layer. The full feedback intake stays in the engine; only the pure seam
// travels with this package.
export interface FeedbackRouteRule {
  /** Prefix matched against FbRecord.page (a page path, e.g. "/site"). An
   * empty string never participates in matching. */
  readonly prefix: string;
  /** Hit → seeded into this session (step-level session pinned, never falls
   * back to defaultSession). */
  readonly session: string;
}
export interface FeedbackRouting {
  readonly rules: readonly FeedbackRouteRule[];
}
/** Pure function: record → target session. Returns '' on no hit (the caller
 * falls back to the engine's defaultSession). */
export const feedbackSessionFor = (r: FbRecord, routing: FeedbackRouting | undefined): string => {
  for (const rule of routing?.rules ?? []) {
    if (rule.prefix !== '' && rule.session !== '' && r.page.startsWith(rule.prefix)) return rule.session;
  }
  return '';
}
