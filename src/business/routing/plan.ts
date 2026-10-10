// Routing planner (CLI dry-run surface): hands a batch of feedback tickets to
// Jev for two semantic judgments — ① classification (choice: which declared
// agent session owns each ticket) ② merging (noul: whether a candidate pair
// shares one root cause and should be handled as a single ticket). The current
// chain (prefix rules / channel default, feedbackSessionFor as the single
// source of truth) is projected alongside as the baseline, making divergence
// visible — to gauge the error-rate gap between "jev judgment vs code
// judgment". Hard boundary: this module computes but never dispatches — no
// dispatch calls, no case creation, no ledger writes (dry-run is a structural
// guarantee, not a switch). Design discipline: code owns the flow (candidate
// pair pre-screening / passes / thresholds / grouping), the model only
// supplies judgments; the Judge port is pluggable, tests use zero network.

import type { Judge, JevAnswer, JevQuestion } from './jev.ts';
import { feedbackSessionFor, type FeedbackRouting } from '../intake/feedbackIntake.ts';
import type { FbRecord } from '../intake/feedbackMirror.ts';

// ---- Plan input ---------------------------------------------------------------

/** Routing menu item for jev (projected from config.agents; the declaration
 * table remains the single structural source). */
export interface RouteAgent {
  readonly session: string;
  readonly company: string;
  readonly domain: string;
  readonly senders: readonly string[];
  readonly cwd: string;
  /** One-line business description — a lever on judgment quality
   * (company/domain alone are too thin). */
  readonly description: string;
}

/** Planning facts: declarations + rules + fallback + (optional) mesh
 * busy/idle projection. */
export interface RoutingFacts {
  readonly agents: readonly RouteAgent[];
  readonly rules: readonly { readonly prefix: string; readonly session: string }[];
  readonly defaultSession: string;
  /** session → busy/idle & liveness (projected from GET /api/agents/graph;
   * omitted when absent). */
  readonly live?: Readonly<Record<string, { readonly working: boolean; readonly live: boolean }>>;
}

export interface RoutedTicket {
  readonly record: FbRecord;
  /** Target session; '' = undecided (needsHuman). */
  readonly session: string;
  readonly via: 'jev' | 'rule' | 'default' | 'uncertain';
  readonly confidence: number;
  readonly probabilities: Readonly<Record<string, number>>;
  /** Which pass resolved it; 0 = baseline-only. */
  readonly pass: number;
  /** How the current engine chain would route it (prefix rule hit or
   * channel-default fallback). */
  readonly baseline: { readonly session: string; readonly source: 'rule' | 'default' };
  /** Tickets suspected of sharing the same root cause (the other end of
   * merge-judgment pairs scoring ≥ the threshold). */
  readonly dupWith?: readonly { readonly id: string; readonly noul: number }[];
}

export interface PlanGroup {
  readonly session: string;
  readonly members: readonly RoutedTicket[];
  /** Pairs within this group judged to share a root cause and suggested for
   * single-ticket handling. */
  readonly mergedPairs: readonly { readonly a: string; readonly b: string; readonly noul: number }[];
  /** Lowest confidence in the group (after merging, the whole group follows
   * the weakest vote). */
  readonly confidence: number;
  readonly live?: { readonly working: boolean; readonly live: boolean };
}

export interface RoutingPlan {
  readonly dryRun: true;
  readonly model: string;
  readonly passes: number;
  readonly usage: { readonly inputTokens: number; readonly outputTokens: number };
  readonly groups: readonly PlanGroup[];
  readonly needsHuman: readonly RoutedTicket[];
  /** Same root cause but routed differently by judgment (or one side
   * undecided) — not merged, surfaced explicitly. */
  readonly crossRouteDups: readonly {
    readonly a: string; readonly b: string; readonly noul: number;
    readonly sessions: readonly [string, string];
  }[];
  readonly stats: {
    readonly tickets: number;
    readonly groups: number;
    readonly merged: number;
    readonly crossRouteDups: number;
    readonly unresolved: number;
    readonly agreeWithBaseline: number;
  };
}

export interface PlanOptions {
  /** null = baseline-only (current-rule projection, no semantic judgment). */
  readonly judge: Judge | null;
  /** Confidence floor for choice (below → next pass). Default 0.5. */
  readonly confidenceFloor?: number;
  /** noul merge threshold. Default 0.6. */
  readonly mergeFloor?: number;
  /** Max convergence passes (exceeded → explicit needsHuman, no blind
   * fallback). Default 2. */
  readonly maxPasses?: number;
  /** Per-ticket body truncation length in state (pass 2 doubles it).
   * Default 500. */
  readonly bodyLimit?: number;
  /** Cap on merge candidate pairs (guards against O(n²) blowup). Default 40. */
  readonly maxDupPairs?: number;
}

// ---- Pure functions -----------------------------------------------------------

export const ticketTitle = (r: FbRecord): string =>
  `${r.page_title || r.page || '(unmounted)'}${r.element_label !== '' ? ` · ${r.element_label}` : ''}`;

/** Current baseline: identical to engine intake (feedbackSessionFor as the
 * single source of truth, no logic copied). */
const baselineOf = (r: FbRecord, facts: RoutingFacts): RoutedTicket['baseline'] => {
  const routing: FeedbackRouting = { rules: facts.rules };
  const hit = feedbackSessionFor(r, routing);
  return hit !== '' ? { session: hit, source: 'rule' } : { session: facts.defaultSession, source: 'default' };
};

/** Merge candidate pair pre-screen (code owns the candidate set, O(n²) stays
 * out of the API): same page / same author / same thread chain. */
export const dupCandidates = (
  records: readonly FbRecord[],
  cap: number,
): readonly (readonly [FbRecord, FbRecord])[] => {
  const out: (readonly [FbRecord, FbRecord])[] = [];
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length && out.length < cap; j++) {
      const a = records[i]!;
      const b = records[j]!;
      const samePage = a.page !== '' && a.page === b.page;
      const sameAuthor = a.author_name !== '' && a.author_name === b.author_name;
      const threaded = (a.reply_to !== '' && (a.reply_to === b.id || a.reply_to === b.reply_to))
        || (b.reply_to !== '' && b.reply_to === a.id);
      if (samePage || sameAuthor || threaded) out.push([a, b]);
    }
  }
  return out;
};

/** Option menu for choice: all declared agents + uncertain (the model must
 * not be forced into a blind pick). */
const agentMenu = (facts: RoutingFacts): Record<string, string> => {
  const criteria: Record<string, string> = {};
  for (const a of facts.agents) {
    if (a.session === '') continue;
    const bits = [`company=${a.company || '—'}`, `domain=${a.domain || '—'}`];
    if (a.cwd !== '') bits.push(`workdir=${a.cwd}`);
    if (a.senders.length > 0) bits.push(`bound senders=${a.senders.join(',')}`);
    const scope = a.description !== '' ? a.description : `owns work where ${bits.join(', ')}`;
    criteria[a.session] = `Agent session "${a.session}": ${scope}${a.description !== '' && bits.length > 0 ? ` (${bits.join(', ')})` : ''}`;
  }
  criteria['uncertain'] = 'No declared agent clearly matches this ticket; a human should decide the route.';
  return criteria;
};

/** Top N candidates from probabilities (for needsHuman display). */
export const topAlternatives = (
  p: Readonly<Record<string, number>>, n = 2,
): readonly { readonly option: string; readonly p: number }[] =>
  Object.entries(p)
    .filter(([k]) => k !== 'uncertain')
    .map(([option, prob]) => ({ option, p: prob }))
    .sort((x, y) => y.p - x.p)
    .slice(0, n);

// ---- Planner ------------------------------------------------------------------

export const planRouting = async (
  records: readonly FbRecord[],
  facts: RoutingFacts,
  opts: PlanOptions,
): Promise<RoutingPlan> => {
  const floor = opts.confidenceFloor ?? 0.5;
  const mergeFloor = opts.mergeFloor ?? 0.6;
  const maxPasses = Math.max(1, opts.maxPasses ?? 2);
  const bodyLimit = opts.bodyLimit ?? 500;
  const maxDupPairs = opts.maxDupPairs ?? 40;

  const routed = new Map<string, RoutedTicket>();
  const lastAttempt = new Map<string, JevAnswer>();
  let passes = 0;
  let usage = { inputTokens: 0, outputTokens: 0 };
  let dupScores: readonly { readonly a: FbRecord; readonly b: FbRecord; readonly noul: number }[] = [];
  const routing: FeedbackRouting = { rules: facts.rules };

  const noJudge = opts.judge === null || records.length === 0 || facts.agents.length === 0;
  if (noJudge) {
    for (const r of records) {
      const baseline = baselineOf(r, facts);
      routed.set(r.id, {
        record: r, session: baseline.session, via: baseline.source, confidence: 1,
        probabilities: {}, pass: 0, baseline,
      });
    }
  } else {
    const judge = opts.judge!;
    let pending = [...records];
    const pairs = dupCandidates(records, maxDupPairs);
    for (let pass = 1; pass <= maxPasses && pending.length > 0; pass++) {
      passes = pass;
      const limit = bodyLimit * pass; // pass 2 feeds more context: longer source text
      const state = {
        agents: facts.agents.map((a) => ({
          session: a.session, company: a.company, domain: a.domain,
          senders: a.senders, cwd: a.cwd, description: a.description,
        })),
        // Declarative context: page ownership rules (evidence, not verdicts —
        // semantics may transcend string matching).
        page_rules: facts.rules,
        tickets: pending.map((r) => ({
          id: r.id, page: r.page, page_title: r.page_title, element_label: r.element_label,
          body: r.body.slice(0, limit), author: r.author_name, author_role: r.author_role,
          parent: r.reply_to, created: r.created,
        })),
      };
      const questions: Record<string, JevQuestion> = {};
      pending.forEach((r, k) => {
        questions[`route_${r.id}`] = {
          type: 'choice',
          instructions: pass === 1
            ? `Which declared agent session should own feedback ticket \`tickets[${k}]\` (id=${r.id})? `
              + `Tickets arrive via a website's embedded feedback panel — \`page\`/\`page_title\` are pages on `
              + `that website. \`page_rules\` declares who maintains which page area: a rule match is evidence `
              + `of ownership, not a verdict — judge each ticket on its merits (e.g. an outage/deployment `
              + `incident on a page may belong to a dev/ops agent, not the page's content owner). `
              + `Match where the reporter points and what they describe against each agent's scope in `
              + `\`agents\`; pick the single best owner.`
            : `Second attempt: the previous routing judgment for ticket id=${r.id} was low-confidence. `
              + `Remember \`page_rules\` declares page-area ownership (evidence, not verdict) and these tickets `
              + `arrive from a website's feedback panel. Re-read \`tickets[${k}]\` closely (fuller text this `
              + `time) and pick the single best owner; choose "uncertain" only if genuinely ambiguous.`,
          criteria: agentMenu(facts),
        };
      });
      if (pass === 1) {
        for (const [a, b] of pairs) {
          const ia = records.indexOf(a);
          const ib = records.indexOf(b);
          questions[`dup_${a.id}__${b.id}`] = {
            type: 'noul',
            instructions: `Do \`tickets[${ia}]\` (id=${a.id}) and \`tickets[${ib}]\` (id=${b.id}) report the same `
              + `underlying issue (one root cause, possibly worded differently) that should be handled as one batch? `
              + `Sharing a page or an author alone does not mean same issue.`,
          };
        }
      }
      const res = await judge.ask(state, questions);
      usage = {
        inputTokens: usage.inputTokens + res.usage.input_tokens,
        outputTokens: usage.outputTokens + res.usage.output_tokens,
      };
      for (const r of [...pending]) {
        const ans = res.answers[`route_${r.id}`];
        if (ans !== undefined && ans.type === 'choice') lastAttempt.set(r.id, ans);
        if (ans !== undefined && ans.type === 'choice' && ans.choice !== 'uncertain' && ans.confidence >= floor) {
          routed.set(r.id, {
            record: r, session: ans.choice, via: 'jev', confidence: ans.confidence,
            probabilities: ans.probabilities, pass, baseline: baselineOf(r, facts),
          });
        }
      }
      pending = pending.filter((r) => !routed.has(r.id));
      if (pass === 1) {
        dupScores = pairs.flatMap(([a, b]) => {
          const ans = res.answers[`dup_${a.id}__${b.id}`];
          return ans !== undefined && ans.type === 'noul' ? [{ a, b, noul: ans.noul }] : [];
        });
      }
    }
  }

  // Undecided tickets (convergence passes exhausted): explicit needsHuman,
  // never a silent fallback — carrying the last pass's candidate order.
  const needsHuman: RoutedTicket[] = [];
  for (const r of records) {
    if (routed.has(r.id)) continue;
    const ans = lastAttempt.get(r.id);
    const probs = ans !== undefined && ans.type === 'choice' ? ans.probabilities : {};
    const conf = ans !== undefined && ans.type === 'choice' ? ans.confidence : 0;
    needsHuman.push({
      record: r, session: '', via: 'uncertain', confidence: conf,
      probabilities: probs, pass: passes, baseline: baselineOf(r, facts),
    });
  }

  // Merge into groups: same-root-cause pairs → union-find; cross-route
  // same-root-cause → surfaced as conflicts, not merged.
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    const p = parent.get(x) ?? x;
    if (p === x) return x;
    const root = find(p);
    parent.set(x, root);
    return root;
  };
  const union = (a: string, b: string): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  const mergedPairs: { a: string; b: string; noul: number }[] = [];
  const crossRouteDups: RoutingPlan['crossRouteDups'][number][] = [];
  for (const { a, b, noul } of dupScores) {
    if (noul < mergeFloor) continue;
    const ra = routed.get(a.id);
    const rb = routed.get(b.id);
    if (ra !== undefined && rb !== undefined && ra.session !== '' && rb.session !== '') {
      if (ra.session === rb.session) {
        union(a.id, b.id);
        mergedPairs.push({ a: a.id, b: b.id, noul });
      } else {
        crossRouteDups.push({ a: a.id, b: b.id, noul, sessions: [ra.session, rb.session] });
      }
    } else {
      crossRouteDups.push({
        a: a.id, b: b.id, noul,
        sessions: [
          ra !== undefined && ra.session !== '' ? ra.session : '(undecided)',
          rb !== undefined && rb.session !== '' ? rb.session : '(undecided)',
        ],
      });
    }
  }
  const dupWithOf = (id: string): { id: string; noul: number }[] => {
    const out: { id: string; noul: number }[] = [];
    for (const { a, b, noul } of dupScores) {
      if (noul >= mergeFloor && a.id === id) out.push({ id: b.id, noul });
      if (noul >= mergeFloor && b.id === id) out.push({ id: a.id, noul });
    }
    return out;
  };

  // Groups: resolved tickets clustered by session (input order preserved);
  // merged pairs recorded in their group; group confidence = member minimum.
  const groupOrder: string[] = [];
  const bySession = new Map<string, RoutedTicket[]>();
  for (const r of records) {
    const t = routed.get(r.id);
    if (t === undefined || t.session === '') continue;
    const list = bySession.get(t.session) ?? [];
    list.push({ ...t, dupWith: dupWithOf(t.record.id) });
    bySession.set(t.session, list);
    if (!groupOrder.includes(t.session)) groupOrder.push(t.session);
  }
  const groups: PlanGroup[] = groupOrder.map((session) => {
    const members = bySession.get(session)!;
    return {
      session,
      members,
      mergedPairs: mergedPairs.filter((p) =>
        members.some((m) => m.record.id === p.a) && members.some((m) => m.record.id === p.b)),
      confidence: Math.min(...members.map((m) => m.confidence)),
      live: facts.live?.[session],
    };
  });
  const needsHumanFinal = needsHuman.map((t) => ({ ...t, dupWith: dupWithOf(t.record.id) }));

  const resolvedJev = [...routed.values()].filter((t) => t.via === 'jev');
  return {
    dryRun: true,
    model: noJudge ? 'baseline-only' : opts.judge!.model,
    passes,
    usage,
    groups,
    needsHuman: needsHumanFinal,
    crossRouteDups,
    stats: {
      tickets: records.length,
      groups: groups.length,
      merged: mergedPairs.length,
      crossRouteDups: crossRouteDups.length,
      unresolved: needsHumanFinal.length,
      agreeWithBaseline: noJudge
        ? records.length
        : resolvedJev.filter((t) => t.session === t.baseline.session).length,
    },
  };
};

// ---- Sample fixtures (--sample: offline and deterministic, touches no
// engine/network) ---------------------------------------------------------------

/** Shape taken from a snapshot of the live declarations (0922): the menu has
 * confusable siblings. */
export const SAMPLE_FACTS: RoutingFacts = {
  agents: [
    { session: 'reply', company: 'acme', domain: 'reply', senders: [], cwd: '', description: 'General replies session: customer email replies and unowned tickets (channel fallback)' },
    { session: 'accounting', company: 'acme', domain: 'accounting', senders: ['finance@acme.example'], cwd: '/srv/acme/finance', description: 'Accounting lane: invoices, payments, bank statements' },
    { session: 'dev', company: 'acme', domain: 'dev', senders: [], cwd: '/srv/acme/platform', description: 'Platform engine and product development' },
    { session: 'research', company: 'acme', domain: 'research', senders: [], cwd: '/srv/acme/research', description: 'Research session' },
    { session: 'site-a', company: 'clienta', domain: 'feedback', senders: [], cwd: '/srv/clients/site-a', description: 'Client A website: page/copy feedback tickets and lead follow-up (page prefix /site-a)' },
    { session: 'clienta-analytics', company: 'clienta', domain: 'research', senders: [], cwd: '/srv/clients/clienta', description: 'Client A case-volume analytics research' },
    { session: 'clienta-retro', company: 'clienta', domain: 'research', senders: [], cwd: '/srv/clients/clienta', description: 'Client A project retrospective research' },
    { session: 'site-b', company: 'clientb', domain: 'feedback', senders: [], cwd: '/srv/clients/site-b', description: 'Client B website: content fixes and feedback panel tickets' },
  ],
  rules: [{ prefix: '/site-b', session: 'site-b' }, { prefix: '/site-a', session: 'site-a' }],
  defaultSession: 'reply',
};

const smpl = (id: string, over: Partial<FbRecord>): FbRecord => ({
  id, created: '2026-09-22 10:00:00', updated: '2026-09-22 10:00:00', status: 'new',
  type: '', page: '', page_title: '', body: '', author_name: '', author_role: '',
  reply_to: '', element_label: '', ...over,
});

/** Six samples: one root cause worded two ways (should merge) / a 502
 * incident / stale content / an unmounted suggestion / a follow-up reply. */
export const SAMPLE_RECORDS: readonly FbRecord[] = [
  smpl('smpl01', {
    page: '/site-a', page_title: 'Homepage', element_label: 'Hero title',
    body: 'The homepage headline has a typo — "intelligent" is spelled wrong. Looks unprofessional, please fix soon.',
    author_name: 'Alex', author_role: 'visitor',
  }),
  smpl('smpl02', {
    page: '/site-a', page_title: 'Homepage', element_label: 'Hero banner',
    body: 'The banner title has a typo. It is the first thing customers see.',
    author_name: 'Sam', author_role: 'customer',
  }),
  smpl('smpl03', {
    page: '/site-a/cases', page_title: 'Case studies', element_label: '',
    body: 'The case studies page has been returning 502 since last night; all other pages are fine.',
    author_name: 'Pat', author_role: 'customer',
  }),
  smpl('smpl04', {
    page: '/site-a/about', page_title: 'About us', element_label: '',
    body: 'The company profile on the About page is from last November — team size and funding are outdated. Please update.',
    author_name: 'Robin', author_role: 'visitor',
  }),
  smpl('smpl05', {
    page: '', page_title: '', element_label: '',
    body: 'Suggestion: add a dark mode to the whole site.',
    author_name: 'Anonymous', author_role: 'visitor',
  }),
  smpl('smpl06', {
    page: '/site-a', page_title: 'Homepage', element_label: 'Hero title',
    body: 'Following up on the typo I reported earlier — still not fixed today.',
    author_name: 'Alex', author_role: 'visitor', reply_to: 'smpl01',
  }),
];