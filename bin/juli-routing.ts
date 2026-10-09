#!/usr/bin/env node
// juli-routing — inspection/demo CLI for the L4 routing layer.
// Usage:
//   juli-routing demo        Run decideRoute + routeTaskMenu on sample data
//   juli-routing decide <email>   Route one sender against the sample declarations
import { decideRoute, routeTaskMenu, SAMPLE_FACTS } from '../src/index.ts';

const [, , cmd, a1] = process.argv;

function sampleRouting() {
  const f = SAMPLE_FACTS;
  return f as unknown as {
    defaultSession: string; defaultProject: string;
    agents: { session: string; company: string; domain: string; senders?: string[] }[];
    boundAgents?: { session: string; senders: string[] }[];
  };
}

switch (cmd) {
  case 'decide': {
    const r = decideRoute(a1 ?? 'someone@example.com', sampleRouting() as never);
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
      const r = decideRoute(from, sampleRouting() as never);
      console.log(`${from.padEnd(28)} → ${r.session}  (${r.chain.join(' → ')})`);
    }
    console.log('--- routeTaskMenu (dispatch candidates) ---');
    for (const m of routeTaskMenu(sampleRouting() as never)) {
      console.log(`  ${m.session.padEnd(20)} ${m.company} / ${m.domain}`);
    }
  }
}
