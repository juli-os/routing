#!/usr/bin/env node
// juli-routing — inspection/demo CLI for the L4 routing layer.
// Usage:
//   juli-routing demo        Run decideRoute + routeTaskMenu on sample data
//   juli-routing decide <email>   Route one sender against the sample declarations
import { decideRoute, routeTaskMenu, SAMPLE_FACTS, type Routing } from '../src/index.ts';

const [, , cmd, a1] = process.argv;

/** SAMPLE_FACTS is the plan-layer fixture (RoutingFacts) reused here as demo
 * input: the overlapping fields (agents/defaultSession) are what decideRoute
 * and routeTaskMenu read; Routing-only fields (defaultProject) and plan-only
 * fields (rules/live) are never touched by either. Single choke-point cast. */
const sampleRouting = (): Routing => SAMPLE_FACTS as unknown as Routing;

switch (cmd) {
  case 'decide': {
    const r = decideRoute(a1 ?? 'someone@example.com', sampleRouting());
    console.log(`from:    ${r.from}`);
    console.log(`session: ${r.session}`);
    console.log(`chain:   ${r.chain.join(' → ')}`);
    for (const [k, v] of Object.entries(r.reasons)) console.log(`  ${k}: ${v}`);
    break;
  }
  case 'demo':
  default: {
    console.log('--- decideRoute samples ---');
    for (const from of ['team@acme.example', 'stranger@nowhere.example']) {
      const r = decideRoute(from, sampleRouting());
      console.log(`${from.padEnd(28)} → ${r.session}  (${r.chain.join(' → ')})`);
    }
    console.log('--- routeTaskMenu (dispatch candidates) ---');
    for (const m of routeTaskMenu(sampleRouting())) {
      console.log(`  ${m.session.padEnd(20)} ${m.company} / ${m.domain}`);
    }
  }
}
