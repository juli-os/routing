import type { FbRecord } from './feedbackMirror.ts';
// Intake port (stub) — pure routing-rule lookup peeled alongside the routing
// layer. The full feedback intake stays in the engine; only the pure seam
// travels with this package.
export interface FeedbackRouteRule {
  /** 匹配 FbRecord.page 的前缀（页面路径，如 "/site"）。空串不参与匹配。 */
  readonly prefix: string;
  /** 命中 → 播种到该会话（步骤级 session 钉死，不再落 defaultSession）。 */
  readonly session: string;
}
export interface FeedbackRouting {
  readonly rules: readonly FeedbackRouteRule[];
}
/** 纯函数：记录 → 目标会话。无命中返回 ''（调用方交给引擎 defaultSession 兜底）。 */
export const feedbackSessionFor = (r: FbRecord, routing: FeedbackRouting | undefined): string => {
  for (const rule of routing?.rules ?? []) {
    if (rule.prefix !== '' && rule.session !== '' && r.page.startsWith(rule.prefix)) return rule.session;
  }
  return '';
}
