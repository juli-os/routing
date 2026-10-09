// L4 routing layer facade — the only public surface of this layer.
// Complete export surface of the five source modules + the peeled intake seam.
// Dependency rule: routing may depend on shared/contracts and the artifacts
// package (types); consumers must never bypass this facade.
export {
  decideRoute, isInternalSender,
  type BoundAgent, type Routing, type AgentDecl, type RouteDecision,
} from './business/routing/decision.ts';
export {
  createJev, jevTokenFromEnv,
  type JevAnswerNoul, type JevAnswerChoice, type JevAnswer,
  type JevQuestion, type JevResult, type Judge, type JevDeps,
} from './business/routing/jev.ts';
export {
  parseJudgmentConfig, loadJudgmentConfig,
  createLocalApiJudge, createCliJudge, createJudgeFromConfig, createJudgmentGateway,
  type JudgmentConfig, type JudgmentGatewayDeps,
} from './business/routing/judgment.ts';
export {
  ticketTitle, dupCandidates, topAlternatives, planRouting,
  SAMPLE_FACTS, SAMPLE_RECORDS,
  type RouteAgent, type RoutingFacts, type RoutedTicket,
  type PlanGroup, type RoutingPlan, type PlanOptions,
} from './business/routing/plan.ts';
export {
  routeTask, routeTaskMenu,
  type TaskLanding, type RouteTaskDeps,
} from './business/routing/routeTask.ts';
// Peeled intake seam (pure lookup + record shape)
export {
  feedbackSessionFor,
  type FeedbackRouteRule, type FeedbackRouting,
} from './business/intake/feedbackIntake.ts';
export type { FbOriginKind, FbRecord } from './business/intake/feedbackMirror.ts';
// Ports (judgment gateway contract) — re-exported for consumer convenience
export {
  JUDGMENT_SCENARIOS,
  type JudgmentGateway, type JudgmentOutcome, type JudgmentScenario,
} from './contracts/ports.ts';
