// Semantic judgment gateway (the Jev/System One production seam): on top of
// the jev.ts transport it does three things — ① scenario switches
// (off/shadow/on, judgment.json hot-read: file edits take effect without
// restart, enable/disable pluggable at any time); ② replaceable provider
// (cloud = TypeSafe API / local-api = any same-shaped HTTP endpoint / cli =
// subprocess JSON stdin→stdout, local deployment with zero code changes);
// ③ degradation discipline (judgment failure/timeout → error outcome, the
// consumer falls back to default behavior — a dead jev must not take the
// pipeline down). Question construction and answer validation live with the
// consumers (decisions stay in the engine; judgment is input only).
// Inherited discipline: a missing config file = all scenarios off + zero
// network (jev never enters paths that did not ask for it).

import { existsSync, readFileSync } from 'node:fs';
import { JUDGMENT_SCENARIOS, type JudgmentGateway, type JudgmentOutcome, type JudgmentScenario } from '../../contracts/ports.ts';
import { createJev, jevTokenFromEnv, type JevAnswer, type JevResult, type Judge } from './jev.ts';

// ---- Config (~/.juli-service/judgment.json, re-read per judgment = hot reload) -

export interface JudgmentConfig {
  readonly provider: 'cloud' | 'local-api' | 'cli';
  readonly cloud?: { readonly baseUrl?: string; readonly model?: string; readonly token?: string; readonly tokenEnv?: string };
  readonly local_api?: { readonly url: string; readonly model?: string };
  readonly cli?: { readonly cmd: readonly string[] };
  readonly timeout_ms?: number;
  readonly min_confidence?: number;
  readonly scenarios?: Partial<Record<JudgmentScenario, 'off' | 'shadow' | 'on'>>;
}

const MODES: readonly string[] = ['off', 'shadow', 'on'];

export const parseJudgmentConfig = (raw: unknown): JudgmentConfig | null => {
  if (raw === null || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  const provider = d['provider'];
  if (provider !== 'cloud' && provider !== 'local-api' && provider !== 'cli') return null;
  const scenarios: Record<string, 'off' | 'shadow' | 'on'> = {};
  const rawScenarios = d['scenarios'];
  if (rawScenarios !== null && typeof rawScenarios === 'object') {
    const known = new Set<string>(JUDGMENT_SCENARIOS);
    for (const [k, v] of Object.entries(rawScenarios as Record<string, unknown>)) {
      if (!MODES.includes(String(v))) continue;
      // Unknown scenario keys are explicitly dropped and logged (judgment.json
      // is a human-edited hot-read surface — "meant to enable aggregate_same
      // but typed aggregate_smae" would silently idle through the entire
      // shadow evaluation period with zero feedback).
      if (!known.has(k)) {
        console.error(`[judgment] judgment.json unknown scenario key (dropped): ${k}`);
        continue;
      }
      scenarios[k] = String(v) as 'off' | 'shadow' | 'on';
    }
  }
  return {
    provider,
    cloud: d['cloud'] as JudgmentConfig['cloud'],
    local_api: d['local_api'] as JudgmentConfig['local_api'],
    cli: d['cli'] as JudgmentConfig['cli'],
    // timeout_ms is clamped to [1s, 30s]: the judgment await sits on the
    // dispatch path holding a per-workflow lock and an intake-desk slot
    // (steps.ts fallback leg) — a huge value like 600000 can hang the queue
    // for 10 minutes, while 0/negative makes every judgment fail instantly
    // (safe degradation, but silently all dead). Out-of-range values snap to
    // the boundary.
    timeout_ms: typeof d['timeout_ms'] === 'number' ? Math.min(30_000, Math.max(1_000, d['timeout_ms'])) : undefined,
    min_confidence: typeof d['min_confidence'] === 'number' ? d['min_confidence'] : undefined,
    scenarios,
  };
};

/** Re-read on every call (same hot-read semantics as feedback-mirror): JSON
 * edits take effect immediately. A missing file = the feature does not exist
 * at all (null → all scenarios off, zero network, zero build). */
export const loadJudgmentConfig = (path: string): JudgmentConfig | null => {
  if (!existsSync(path)) return null;
  try {
    return parseJudgmentConfig(JSON.parse(readFileSync(path, 'utf8')));
  } catch {
    return null; // Broken config = off; never go out to the network in a bad state
  }
};

// ---- Providers (all three same-shaped Judges — the replacement seam of ②) ----

/** local-api: any HTTP endpoint implementing the {state,model,questions} →
 * {answers} contract (point it here when running jev locally; the response
 * shape matches the cloud). */
export const createLocalApiJudge = (opts: {
  readonly url: string;
  readonly model?: string;
  readonly timeoutMs?: number;
  readonly fetchImpl?: typeof fetch;
}): Judge => {
  const doFetch = opts.fetchImpl ?? fetch;
  return {
    model: opts.model ?? 'jev-local',
    async ask(state, questions) {
      const res = await doFetch(opts.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, model: opts.model ?? 'jev-local', questions }),
        signal: AbortSignal.timeout(opts.timeoutMs ?? 30_000),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`local-api judge ${res.status}: ${text.slice(0, 200)}`);
      const d = JSON.parse(text) as { answers?: Record<string, JevAnswer>; model?: string };
      if (d.answers === null || typeof d.answers !== 'object') {
        throw new Error(`local-api response missing answers: ${text.slice(0, 200)}`);
      }
      const result: JevResult = {
        model: d.model ?? opts.model ?? 'jev-local',
        answers: d.answers,
        usage: { input_tokens: 0, output_tokens: 0, cached_tokens: 0 },
      };
      return result;
    },
  };
};

/** cli: subprocess judgment — JSON {state,questions} via stdin, {answers}
 * via stdout. Local CLI deployments (offline models / script wrappers) plug
 * in with zero code changes. */
export const createCliJudge = (opts: {
  readonly cmd: readonly string[];
  readonly timeoutMs?: number;
  readonly spawnImpl?: typeof import('node:child_process').spawn;
}): Judge => {
  const spawnImpl = opts.spawnImpl ?? (async () => {
    const { spawn } = await import('node:child_process');
    return spawn;
  })();
  return {
    model: `cli:${opts.cmd[0] ?? ''}`,
    async ask(state, questions) {
      const spawn = await spawnImpl;
      const result = await new Promise<JevResult>((resolveP, rejectP) => {
        const child = spawn(opts.cmd[0]!, opts.cmd.slice(1), { stdio: ['pipe', 'pipe', 'pipe'] });
        let out = '';
        let errOut = ''; // Collect stderr: keeps a diagnostic trail in the error message when the cli judgment fails
        const timer = setTimeout(() => {
          child.kill();
          rejectP(new Error(`cli judge timeout (${opts.timeoutMs ?? 30_000}ms)`));
        }, opts.timeoutMs ?? 30_000);
        child.stdout.on('data', (c: Buffer) => { out += String(c); });
        child.stderr.on('data', (c: Buffer) => { errOut += String(c); });
        child.on('error', (e: Error) => { clearTimeout(timer); rejectP(e); });
        child.on('close', (code: number | null) => {
          clearTimeout(timer);
          const diag = errOut.trim() !== '' ? `: ${errOut.slice(0, 200)}` : '';
          if (code !== 0) { rejectP(new Error(`cli judge exit code ${code}${diag}`)); return; }
          try {
            const d = JSON.parse(out) as { answers?: unknown; model?: string };
            if (d.answers === null || typeof d.answers !== 'object') {
              rejectP(new Error(`cli judge response missing answers: ${out.slice(0, 200)}${diag}`));
              return;
            }
            resolveP({
              model: d.model ?? `cli:${opts.cmd[0] ?? ''}`,
              answers: d.answers as Record<string, JevAnswer>,
              usage: { input_tokens: 0, output_tokens: 0, cached_tokens: 0 },
            });
          } catch { rejectP(new Error(`cli judge response is not JSON: ${out.slice(0, 200)}${diag}`)); }
        });
        child.stdin.write(JSON.stringify({ state, questions }));
        child.stdin.end();
      });
      return result;
    },
  };
};

/** Pick the provider from config. Missing credential/url/cmd → null (the
 * gateway degrades to all-off). */
export const createJudgeFromConfig = (
  cfg: JudgmentConfig,
  env: Readonly<Record<string, string | undefined>> = process.env,
): Judge | null => {
  const timeoutMs = cfg.timeout_ms ?? 15_000;
  if (cfg.provider === 'cloud') {
    // Token source priority: cloud.token (written directly in config, user
    // ruling 2026-09-28 — decouples the engine process from the launching
    // shell's env, so nohup/launchd/manual starts always have a token) >
    // custom tokenEnv (exact match on that name) > the JEV_TOKEN →
    // TYPESAFE_API_KEY fallback chain (legacy compatibility). Previously the
    // env was filtered down to a single-key object before feeding the
    // fallback chain, so neither fallback key could be found — a custom name
    // was always '' (config got in, judge forever null).
    const token = (cfg.cloud?.token ?? '') !== ''
      ? cfg.cloud!.token!
      : (cfg.cloud?.tokenEnv !== undefined && cfg.cloud.tokenEnv !== ''
        ? (env[cfg.cloud.tokenEnv] ?? '')
        : jevTokenFromEnv(env));
    if (token === '') return null;
    return createJev({ token, baseUrl: cfg.cloud?.baseUrl, model: cfg.cloud?.model, timeoutMs });
  }
  if (cfg.provider === 'local-api') {
    if (cfg.local_api?.url === undefined || cfg.local_api.url === '') return null;
    return createLocalApiJudge({ url: cfg.local_api.url, model: cfg.local_api.model, timeoutMs });
  }
  if (cfg.cli?.cmd === undefined || cfg.cli.cmd.length === 0) return null;
  return createCliJudge({ cmd: cfg.cli.cmd, timeoutMs });
};

// ---- Gateway ------------------------------------------------------------------

export interface JudgmentGatewayDeps {
  /** Hot-read config (production = () => loadJudgmentConfig(path)). */
  readonly load: () => JudgmentConfig | null;
  /** Judge construction (rebuilt on config change; token env is read here). */
  readonly judgeOf: (cfg: JudgmentConfig) => Judge | null;
  /** Usage receipt (production = usage.record into prompt_usage — judgment
   * costs share the same ledger as the orchestrator/CC; failed calls are
   * recorded too: tokens 0, error left for diagnosis). off / provider
   * unavailable means no network call, hence no receipt. */
  readonly onUsage?: (r: {
    readonly scenario: JudgmentScenario;
    readonly mode: 'shadow' | 'on';
    readonly model: string;
    readonly inputTokens: number;
    readonly cachedTokens?: number;
    readonly outputTokens: number;
    readonly durationMs: number;
    readonly ok: boolean;
    readonly error?: string;
  }) => void;
  readonly log?: (m: string) => void;
}

export const createJudgmentGateway = (deps: JudgmentGatewayDeps): JudgmentGateway => {
  let cached: { readonly key: string; readonly judge: Judge | null } | null = null;
  // Usage accounting (production = sqlite write) must never backfire on the
  // judgment: a write failure degrades to a log line. Otherwise a successful
  // judgment gets disguised as ok:false (shadow-ledger pollution), and
  // persistent failures make ask reject straight through to the consumer —
  // breaking the "gateway never throws" discipline (2026-09-27 review P2-3).
  const recordUsage = (r: Parameters<NonNullable<JudgmentGatewayDeps['onUsage']>>[0]): void => {
    try {
      deps.onUsage?.(r);
    } catch (e) {
      deps.log?.(`[judgment] usage accounting failed (ignored): ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  const judgeFor = (cfg: JudgmentConfig): Judge | null => {
    // The cache key includes timeout_ms: a timeout-only tweak (e.g. 15s→5s as
    // a provider slows down) must also rebuild, otherwise the old timeout
    // lives until some other field changes — violating the hot-read promise
    // that file edits take effect immediately.
    const key = JSON.stringify({ p: cfg.provider, c: cfg.cloud ?? {}, l: cfg.local_api ?? {}, x: cfg.cli ?? {}, t: cfg.timeout_ms });
    if (cached === null || cached.key !== key) {
      cached = { key, judge: deps.judgeOf(cfg) };
      if (cached.judge === null) deps.log?.(`[judgment] provider unavailable (missing credential/url/cmd) — all scenarios off`);
    }
    return cached.judge;
  };
  return {
    threshold() {
      return deps.load()?.min_confidence ?? 0.7;
    },
    async ask(scenario, state, questions) {
      const cfg = deps.load();
      const mode = cfg?.scenarios?.[scenario] ?? 'off';
      if (cfg === null || mode === 'off') return null;
      const judge = judgeFor(cfg);
      // mode and threshold come from this single load and are returned with
      // the result — consumers treat the outcome as authoritative and stop
      // re-reading config themselves, closing the TOCTOU window where hot
      // edits land between reads.
      const base = { mode, provider: `${cfg.provider}`, threshold: cfg.min_confidence ?? 0.7 } as const;
      if (judge === null) {
        return { ...base, ok: false, error: 'provider unavailable' };
      }
      const t0 = Date.now();
      try {
        const r = await judge.ask(state, questions);
        const durationMs = Date.now() - t0;
        recordUsage({
          scenario, mode, model: r.model,
          inputTokens: r.usage.input_tokens, outputTokens: r.usage.output_tokens,
            cachedTokens: Number(r.usage.cached_tokens ?? r.usage.prompt_tokens_details?.cached_tokens ?? 0) || undefined,
          durationMs, ok: true,
        });
        // Answers are looked up by question key (multi-question responses are
        // never silently mismatched onto "the first value"). Polarity mapping
        // is per question; the legacy top-level fields = the first question's
        // answer (existing single-question consumers need zero changes).
        const answerOf = (a: unknown): { answer?: string; confidence?: number; probabilities?: Readonly<Record<string, number>> } => {
          const first = a as
            | { choice?: string; confidence?: number; probabilities?: Readonly<Record<string, number>>; noul?: number }
            | undefined;
          if (typeof first?.noul === 'number') {
            // noul polarity (pinned in plan.ts) = P(answer is yes).
            // confidence is the probability of **the chosen answer**: on a
            // 'false' verdict (not worth opening a case) it is 1-noul — a
            // confident model rejection must still clear the consumer
            // threshold, otherwise "answer==='false' && confidence>=0.7" is
            // the empty set and on mode never blocks a single case (P1).
            // probabilities fills in both poles for shadow-period evaluation.
            return {
              answer: first.noul >= 0.5 ? 'true' : 'false',
              confidence: first.noul >= 0.5 ? first.noul : 1 - first.noul,
              probabilities: { true: first.noul, false: 1 - first.noul },
            };
          }
          return { answer: first?.choice, confidence: first?.confidence, probabilities: first?.probabilities };
        };
        const qk = Object.keys(questions)[0];
        const first = qk !== undefined ? answerOf(r.answers[qk]) : {};
        const answers: Record<string, { answer?: string; confidence?: number }> = {};
        for (const [k, v] of Object.entries(r.answers)) {
          const a = answerOf(v);
          answers[k] = { answer: a.answer, confidence: a.confidence };
        }
        return {
          ...base, ok: true,
          answer: first.answer, confidence: first.confidence, probabilities: first.probabilities,
          answers, model: r.model, inputTokens: r.usage.input_tokens,
          outputTokens: r.usage.output_tokens, durationMs,
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const durationMs = Date.now() - t0;
        // Failed calls are accounted too (tokens 0): the cost ledger doubles
        // as the operational view of "how many judgment attempts happened" —
        // a silent failure would masquerade as "zero cost, zero runs" during
        // the shadow period.
        recordUsage({
          scenario, mode, model: judge.model, inputTokens: 0, outputTokens: 0,
          durationMs, ok: false, error: msg.slice(0, 80),
        });
        deps.log?.(`[judgment] ${scenario} judgment failed (default behavior applies): ${msg}`);
        // The error string contains remotely controllable response-body
        // fragments and the ledger is an audit surface — only the first 80
        // characters are recorded; the full diagnosis lives in the log line
        // above.
        return { ...base, ok: false, error: msg.slice(0, 80) };
      }
    },
  };
};
