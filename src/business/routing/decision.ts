// Routing judgment (board-B decision chain, pure and replayable): rules are
// deterministic — classification is input, the declaration table drives
// routing, the LLM takes no part in routing. Engine intake
// (startEmailWorkflow), the party projection, and the web/CLI audit views all
// share this single source of truth.

/** Bound session (dedicated agent isolation): session name + its own cwd +
 * allowlisted senders. Only mail from allowlisted senders routes a case into
 * the bound session; every other channel (web/CLI/agent-step pinning) is
 * refused by runAgentStep's session_bound guard. */
export interface BoundAgent {
  readonly session: string;
  readonly cwd: string;
  readonly senders: readonly string[];
}

export interface Routing {
  readonly defaultSession: string;
  readonly defaultProject: string;
  /** Internal domains (our own domains, e.g. acme.example): internal =
   * bound-allowlist exact addresses ∪ these domains. agents.senders declares
   * customer sender domains (used for routing matches) and never counts as
   * internal — a customer contact was once swallowed into the internal
   * bucket (live incident 2026-09-22). */
  readonly internalDomains?: readonly string[];
  /** Optional: bound-session table (production source: config.email.bound_agents). */
  readonly boundAgents?: readonly BoundAgent[];
  /** Optional: full agents declaration (production source: config.agents) —
   * the single structural source for the two organization-tree dimensions;
   * route_decision's company/domain judgment reads from here. */
  readonly agents?: readonly AgentDecl[];
}

/** One entry of the agents.yaml declaration section (config.agents). */
export interface AgentDecl {
  readonly session: string;
  readonly company: string;
  readonly domain: string;
  /** Sender-domain declaration (one input to company matching; binding
   * semantics stay in bound_agents). */
  readonly senders?: readonly string[];
  readonly cwd?: string;
  /** One-line business description (declared in config.agents; a lever on
   * both judgment and display quality for the jev routing menu / pin list —
   * company/domain alone are too thin). */
  readonly description?: string;
  /** Model tier (user ruling 2026-09-28: "no high intelligence unless
   * necessary"): standard = the default tier everywhere; high = carries the
   * high-tier --model id during cold-start onboarding; tasks with
   * input.model_tier='high' are diverted at routing time to the high
   * declared session (same-cwd twin preferred). Defaults to standard. */
  readonly model_tier?: 'standard' | 'high';
}

/** route_decision event payload (boards B/D): chain + per-hop reason +
 * whether it fell back. Pure projection data — one copy into the events
 * ledger and one into workflow.meta (the iOS case detail reads meta to
 * render the chain card; the Agents tab reads events to render recent
 * dispatches). */
export interface RouteDecision {
  readonly from: string;
  readonly company: string;
  readonly domain: string;
  readonly session: string;
  readonly chain: readonly string[];
  readonly reasons: Readonly<Record<string, string>>;
  readonly fallback: boolean;
}

/** Routing judgment: authz → company → domain → bound/sender_domain/default
 * (2026-09-30: unbound domain hits divert to the claiming declared session;
 * jev content judgment overrides on the consumer side). */
export const decideRoute = (from: string, routing: Routing): RouteDecision => {
  const decls = routing.agents ?? [];
  const declBy = (session: string): AgentDecl | undefined =>
    decls.find((d) => d.session === session);
  const bound = (routing.boundAgents ?? []).find((b) =>
    b.senders.some((s) => s.trim().toLowerCase() === from.trim().toLowerCase()));
  if (bound !== undefined) {
    const d = declBy(bound.session);
    const company = d?.company || '';
    const domain = d?.domain || '';
    return {
      from,
      company,
      domain,
      session: bound.session,
      chain: ['authz', 'company', 'domain', 'bound'],
      reasons: {
        authz: `${from} ∈ allowlist`,
        company: company !== '' ? `bound decl → ${company}` : 'bound (decl missing company)',
        domain: domain !== '' ? `decl hit ${domain}` : 'decl missing domain',
        bound: 'session_bound direct · no fallback',
      },
      fallback: false,
    };
  }
  // Unbound: domain matching of the sender domain against declared senders
  // (contact@client.example → client decl). User ruling 2026-09-30
  // "everything goes through routing": a domain hit was upgraded from
  // "merely annotate the company" to a true diversion — the unbound declared
  // session claiming that sender domain is the resolved target. Bound
  // sessions are skipped (they only accept allowlisted addresses; the domain
  // leg sending other same-domain senders in would be refused by the
  // session_bound guard). jev content judgment (intake.ts) sits above this
  // leg: sufficient confidence = content beats the coarse domain. No hit
  // falls to the default.
  const dom = from.split('@')[1]?.toLowerCase() ?? '';
  const boundNames = new Set((routing.boundAgents ?? []).map((b) => b.session));
  const hit = dom === '' ? undefined : decls.find((d) =>
    !boundNames.has(d.session)
    && (d.senders ?? []).some((s) => s.split('@')[1]?.toLowerCase() === dom));
  const company = hit?.company ?? '';
  const session = hit?.session ?? routing.defaultSession;
  const dd = declBy(session);
  const defDomain = dd?.domain || '';
  return {
    from,
    company,
    domain: defDomain,
    session,
    chain: hit !== undefined
      ? ['authz', 'company', 'domain', 'sender_domain']
      : ['authz', 'company', 'domain', 'default'],
    reasons: {
      authz: `${from} ∈ allowlist`,
      company: hit !== undefined ? `sender domain ${dom} → ${company}` : 'default (no declaration)',
      domain: defDomain !== '' ? `landing session business ${defDomain}` : 'default routing',
      ...(hit !== undefined
        ? { sender_domain: `sender domain claimed by ${hit.session} → lands ${hit.session} (jev content judgment may override)` }
        : { default: `default session ${routing.defaultSession}` }),
    },
    fallback: false,
  };
};

/** Internal-sender judgment (phase-3 Party line): reuses the existing
 * declaration table and the same domain-matching rules as decideRoute — the
 * sender domain hits a domain declared in config.agents senders, or exactly
 * hits a bound_agents address → internal. Internal addresses skip the CRM
 * and never enter the customer projection. */
export const isInternalSender = (from: string, routing: Routing): boolean => {
  const email = from.trim().toLowerCase();
  const dom = email.split('@')[1] ?? '';
  if (dom === '') return false;
  if ((routing.internalDomains ?? []).some((d) => d.toLowerCase() === dom)) return true;
  return (routing.boundAgents ?? []).some((b) =>
    b.senders.some((s) => s.trim().toLowerCase() === email));
};
