// Task routing (user ruling 2026-09-30 "everything goes through routing"):
// resolved-target judgment for keyless case creation — the chat plan stash
// and the HTTP /api/lifecycle/tasks fallback share this one entry point.
// Layered adjudication (settled in the 0930 conversation): routing decisions
// live only in the routing layer (this function); the input layer only relays
// a user pin or calls this function, never picks a session itself.
// Priority: explicit pin (handled by the caller, bypasses this function — a
// pinned target never diverts, it would rather queue) > jev content judgment
// > busy/idle diversion (same-company idle preferred) > default fallback.
// Busy = a non-terminal case exists under the session's name (including
// queued / stopped at a gate awaiting approval — the redefined 0930
// busy/idle semantics).

import type { AgentDecl, Routing } from './decision.ts';
import type { JudgmentGateway } from '../../contracts/ports.ts';

export interface TaskLanding {
  readonly session: string;
  /** Human-readable note (shown on the plan card / in logs, e.g. "juli-reply
   * busy → diverted to juli-dev"). */
  readonly note: string;
  /** Judgment source: jev content judgment or default fallback. */
  readonly via: 'jev' | 'default';
  /** Ideal target from jev/default (the value before busy/idle diversion;
   * ≠ session when diverted). */
  readonly ideal: string;
  /** A busy/idle diversion occurred. */
  readonly diverted: boolean;
}

export interface RouteTaskDeps {
  readonly routing: Routing;
  readonly judgment?: JudgmentGateway;
  /** Busy/idle predicate (production = store.sessionHasOpenWork). */
  readonly busySession: (session: string) => boolean;
  /** Sessions actually present in tmux (diversion candidates must really
   * exist, same discipline as the dispatch surface; unchecked when omitted). */
  readonly availableSessions?: readonly string[];
}

/** Candidate menu: declared sessions that are neither bound nor high-tier
 * twins. Bound sessions only accept allowlisted addresses (the session_bound
 * guard refuses dispatch — putting them on the menu creates dead tickets);
 * the high tier is a cost-diversion target, never a content-routing target
 * ("no high intelligence unless necessary"). The chat pinnable list shares
 * this source (reused at runtime). */
export const routeTaskMenu = (routing: Routing): readonly AgentDecl[] => {
  const bound = new Set((routing.boundAgents ?? []).map((b) => b.session));
  return (routing.agents ?? []).filter((a) =>
    a.session.trim() !== '' && !bound.has(a.session) && a.model_tier !== 'high');
};

/** Resolved-target judgment for keyless case creation (fail-open: judgment
 * down/off/low-confidence = existing default behavior). */
export const routeTask = async (title: string, brief: string, deps: RouteTaskDeps): Promise<TaskLanding> => {
  const def = deps.routing.defaultSession;
  const menu = routeTaskMenu(deps.routing);
  if (menu.length === 0) {
    return { session: def, note: 'no candidate declared session, default routing', via: 'default', ideal: def, diverted: false };
  }
  // jev content judgment (same scenario as route_intake, shared with the
  // email line): on + above threshold + answer inside the menu + **tmux
  // liveness** (run-11 P2-3: adopting a hit on an offline declared session
  // pins the target into an offline session, the dispatch surface's
  // resolveSession silently falls back to default and the pin follows — the
  // plan card's promise goes false. Offline is treated as fail-open: land on
  // default, still divertible when busy); shadow/off/failure = zero behavior
  // change.
  let ideal = def;
  let via: 'jev' | 'default' = 'default';
  let offlineHit = '';
  if (deps.judgment !== undefined) {
    const criteria: Record<string, string> = {};
    for (const d of menu) {
      const doms = (d.senders ?? []).map((x) => x.split('@')[1] ?? '').filter((x) => x !== '').join(',');
      criteria[d.session] = `company=${d.company} domain=${d.domain}${doms !== '' ? ` senderDomains=${doms}` : ''}`
        + (d.description !== undefined && d.description !== '' ? ` desc=${d.description}` : '');
    }
    const outcome = await deps.judgment.ask('route_intake',
      { title, brief: brief.slice(0, 600), rule_session: def },
      { target_session: { type: 'choice', instructions: 'Which declared session (by company/domain) should own this task?', criteria } });
    const menuHit = outcome !== null && outcome.ok && outcome.mode === 'on' && outcome.answer !== undefined
      && menu.some((d) => d.session === outcome.answer)
      && (outcome.confidence ?? 0) >= outcome.threshold;
    if (menuHit && (deps.availableSessions === undefined || deps.availableSessions.includes(outcome.answer!))) {
      ideal = outcome.answer!;
      via = 'jev';
    } else if (menuHit) {
      // Liveness check failed (unchecked when availableSessions is omitted =
      // old behavior): the judgment hit an offline session — not adopted, and
      // the note records it honestly (the plan card can show why it landed
      // on default).
      offlineHit = outcome.answer!;
    }
  }
  // Busy/idle awareness (0930): ideal target busy → an idle declared session
  // (same company first, cross-company next); all busy → queue on the ideal
  // session. Candidates must really exist in tmux (same source as the
  // dispatch surface's idleOf).
  if (ideal !== '' && deps.busySession(ideal)) {
    const home = menu.find((a) => a.session === ideal)?.company ?? '';
    const idle = [...menu.filter((a) => a.company === home), ...menu.filter((a) => a.company !== home)]
      .find((a) => a.session !== ideal && !deps.busySession(a.session)
        && (deps.availableSessions === undefined || deps.availableSessions.includes(a.session)));
    if (idle !== undefined) {
      return { session: idle.session, note: `${ideal} busy → diverted to ${idle.session}`, via, ideal, diverted: true };
    }
    return { session: ideal, note: `${ideal} (busy, queued)`, via, ideal, diverted: false };
  }
  if (offlineHit !== '') {
    return { session: ideal, note: `${offlineHit} offline (hit not adopted) → default ${ideal}`, via, ideal, diverted: false };
  }
  return { session: ideal, note: ideal, via, ideal, diverted: false };
};
