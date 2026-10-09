# @juli-os/routing — L4 Routing Layer

The L4 layer of the juli-os ladder: **multi-agent dispatch decisions as pure functions**. Declarative agent routing, busy-diversion, sender-domain claims, a pluggable judgment gateway (bring your own LLM judge) — all over injected facts, replayable, zero hidden state.

## What's inside

| Capability | API | What it gives you |
|---|---|---|
| Route decision | `decideRoute(from, routing)` | Deterministic chain: bound allowlist → sender-domain claim → default, with human-readable reasons per hop |
| Dispatch menu | `routeTaskMenu(routing)` | Candidate sessions for new tasks (bound sessions excluded) |
| Task landing | `routeTask(title, brief, deps)` | Keyless intake landing incl. busy-diversion to an idle sibling |
| Routing plan | `planRouting(records, facts, opts)` | Group/dedup feedback records into routed tickets |
| Judgment gateway | `createJudgmentGateway(deps)` + `JUDGMENT_SCENARIOS` | Pluggable LLM judge (local API / CLI / off) behind the `JudgmentGateway` port — deterministic fallback when unavailable |
| Feedback seam | `feedbackSessionFor(record, routing)` | Pure prefix-rule lookup for channel routing |

## Peel boundary

Copied verbatim from the juli monorepo (`business/routing`), with the pure intake seam (`feedbackSessionFor` + record shape) peeled alongside. Ports (`contracts/ports.ts`) reference artifact types via `@juli-os/artifacts` — the first cross-layer composition of the ladder.

Dependencies point strictly downward; consumers import only the facade `src/index.ts`.

## Quick start — no install step for source use

Requires Node ≥ 22.18 (type stripping) for source; the npm package ships compiled JS + d.ts.

```bash
node bin/juli-routing.ts demo          # sample routing + dispatch menu
node bin/juli-routing.ts decide alice@acme.example
```

```ts
import { decideRoute } from '@juli-os/routing';
const d = decideRoute('team@client.example', {
  defaultSession: 'reply', defaultProject: 'p',
  agents: [{ session: 'client-lane', company: 'Client', domain: 'feedback',
             senders: ['team@client.example'] }],
  boundAgents: [],
});
// d.session === 'client-lane'; d.chain explains every hop
```

## Design stance

Code owns the routing; LLMs never route (they may judge content on top, behind a port). Every decision lands in your ledger with its full reason chain.

## License

Apache-2.0
