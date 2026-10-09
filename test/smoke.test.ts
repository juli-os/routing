// L4 routing standalone smoke: pure functions must work with injected facts,
// zero network (jev off), zero config.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  decideRoute, routeTaskMenu, SAMPLE_FACTS, SAMPLE_RECORDS,
  feedbackSessionFor, JUDGMENT_SCENARIOS,
} from '../src/index.ts';

test('decideRoute: domain claim routes; unknown sender falls to default', () => {
  const routing = {
    defaultSession: 's-general', defaultProject: 'p',
    agents: [
      { session: 's-dev', company: 'Acme', domain: 'product',
        senders: ['team@dev.example.com'] },
      { session: 's-general', company: '', domain: 'general' },
    ],
    boundAgents: [],
  };
  const hit = decideRoute('owner@dev.example.com', routing as never);
  assert.equal(hit.session, 's-dev');
  const fallback = decideRoute('stranger@nowhere.com', routing as never);
  assert.equal(fallback.session, 's-general');
});

test('routeTaskMenu: bound sessions excluded from the dispatch menu', () => {
  const routing = {
    defaultSession: 's-a', defaultProject: 'p',
    agents: [
      { session: 's-a', company: '', domain: 'x' },
      { session: 's-b', company: '', domain: 'y' },
    ],
    boundAgents: [{ session: 's-b', cwd: '/w', senders: ['vip@example.com'] }],
  };
  const menu = routeTaskMenu(routing as never);
  assert.deepEqual(menu.map((m) => m.session), ['s-a']);
});

test('sample fixtures exist and are plain data', () => {
  assert.ok(Array.isArray(SAMPLE_RECORDS) && SAMPLE_RECORDS.length > 0);
  assert.ok(SAMPLE_FACTS && Array.isArray(SAMPLE_FACTS.agents));
});

test('feedback seam: prefix rule lookup is pure', () => {
  const r = feedbackSessionFor(
    { page: '/pricing/hero', } as never,
    { rules: [{ prefix: '/pricing', session: 's-web' }] },
  );
  assert.equal(r, 's-web');
});

test('judgment scenarios contract exported', () => {
  assert.ok(JUDGMENT_SCENARIOS.length > 0);
});
