// 语义判定网关（Jev/System One 生产接缝）：在 jev.ts 传输层之上做三件事——
// ①场景开关（off/shadow/on，judgment.json 热读：改文件不重启生效，enable/
//   disable 随时拔插）；②提供方可替换（cloud=TypeSafe API / local-api=任意
//   同形 HTTP 端点 / cli=子进程 JSON stdin→stdout，本地部署零改码）；③降级
//   纪律（判定失败/超时 → error 结果，消费方按默认行为走——jev 挂了不许挂
//   管线）。问题构造与答案校验在消费方（决定留引擎，判定只做输入）。
// 纪律继承：配置文件缺省 = 全场景 off + 零网络（jev 不进不请自来的路径）。

import { existsSync, readFileSync } from 'node:fs';
import { JUDGMENT_SCENARIOS, type JudgmentGateway, type JudgmentOutcome, type JudgmentScenario } from '../../contracts/ports.ts';
import { createJev, jevTokenFromEnv, type JevAnswer, type JevResult, type Judge } from './jev.ts';

// ---- 配置（~/.juli-service/judgment.json，每次判定重读=热生效） ----------------

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

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

export const parseJudgmentConfig = (raw: unknown): JudgmentConfig | null => {
  if (raw === null || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  const provider = d['provider'];
  if (provider !== 'cloud' && provider !== 'local-api' && provider !== 'cli') return null;
  // 子对象形状校验（judgment.json 是人工热读面）：此前 cloud/local_api/cli 直接
  // as 信任——cli.cmd 传字符串能穿过 createJudgeFromConfig 的 `cmd.length === 0`
  // 检查（字符串也有 length），随后 cmd.slice(1) 会把字符串按字符拆参 spawn。
  // 坏形状一律 null（坏配置=关，绝不带病出网）；缺字段保持既有降级语义
  // （缺 cmd → 提供方不可用 → 全场景 off，见 createJudgeFromConfig）。
  if (d['cloud'] !== undefined && !isPlainObject(d['cloud'])) return null;
  if (d['local_api'] !== undefined && !isPlainObject(d['local_api'])) return null;
  if (d['cli'] !== undefined) {
    if (!isPlainObject(d['cli'])) return null;
    const cmd = (d['cli'] as Record<string, unknown>)['cmd'];
    if (cmd !== undefined && (!Array.isArray(cmd) || !cmd.every((c) => typeof c === 'string'))) return null;
  }
  const scenarios: Record<string, 'off' | 'shadow' | 'on'> = {};
  const rawScenarios = d['scenarios'];
  if (rawScenarios !== null && typeof rawScenarios === 'object') {
    const known = new Set<string>(JUDGMENT_SCENARIOS);
    for (const [k, v] of Object.entries(rawScenarios as Record<string, unknown>)) {
      if (!MODES.includes(String(v))) continue;
      // 未知场景键显式丢弃并留痕（judgment.json 是人工热读面——「想开
      // aggregate_same 写成 aggregate_smae」若无反馈，影子评估期会静默空转）。
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
    // timeout_ms 夹紧 [1s, 30s]：判定 await 在派发路径上持 per-workflow 锁与
    // 收单台槽位（steps.ts fallback 腿）——巨值=配 600000 就能把队列挂住 10 分钟，
    // 0/负=全部判定立即失败（降级安全但静默全废）。超界取边界值。
    timeout_ms: typeof d['timeout_ms'] === 'number' ? Math.min(30_000, Math.max(1_000, d['timeout_ms'])) : undefined,
    min_confidence: typeof d['min_confidence'] === 'number' ? d['min_confidence'] : undefined,
    scenarios,
  };
};

/** 每次调用重读（feedback-mirror 同款热读语义）：改 JSON 即时生效。文件缺失
 * = 功能整体不存在（null → 全场景 off，零网络零构建）。 */
export const loadJudgmentConfig = (path: string): JudgmentConfig | null => {
  if (!existsSync(path)) return null;
  try {
    return parseJudgmentConfig(JSON.parse(readFileSync(path, 'utf8')));
  } catch {
    return null; // 坏配置 = 关，绝不带病出网
  }
};

// ---- 提供方（三者同形，都是 Judge——约束②的替换接缝） -------------------------

/** local-api：任意实现 {state,model,questions} → {answers} 契约的 HTTP 端点
 * （本地部署 jev 时指过来即可，响应形状与云端一致）。 */
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

/** cli：子进程判定——JSON {state,questions} 走 stdin，{answers} 走 stdout。
 * 本地 CLI 部署（离线模型/脚本包装）零改码接入。 */
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
        let errOut = ''; // stderr 收进来：cli 判定失败时错误消息里留诊断线索
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

/** 按配置挑提供方。缺凭证/缺 url/缺 cmd → null（网关降级为全 off）。 */
export const createJudgeFromConfig = (
  cfg: JudgmentConfig,
  env: Readonly<Record<string, string | undefined>> = process.env,
): Judge | null => {
  const timeoutMs = cfg.timeout_ms ?? 15_000;
  if (cfg.provider === 'cloud') {
    // token 来源优先级：cloud.token（配置直书，2026-09-28 用户裁定——引擎
    // 进程与启动 shell 的 env 解耦，nohup/launchd/手工启动一律有 token）>
    // 自定义 tokenEnv（精确匹配该名）> JEV_TOKEN→TYPESAFE_API_KEY 兜底链
    // （兼容存量）。此前把 env 过滤成单键对象再喂兜底链，两个兜底键都查
    // 不到——自定义名恒 ''（配置进得去、永远 null）。
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

// ---- 网关 ---------------------------------------------------------------------

export interface JudgmentGatewayDeps {
  /** 热读配置（生产 = () => loadJudgmentConfig(path)）。 */
  readonly load: () => JudgmentConfig | null;
  /** Judge 构建（配置变化时重建；token 在此读 env）。 */
  readonly judgeOf: (cfg: JudgmentConfig) => Judge | null;
  /** 用量回执（生产 = usage.record 进 prompt_usage——判定成本与编排器/CC
   * 同一本账；失败调用也记：tokens 为 0、error 留诊断）。off/提供方不可用
   * 不出网，不产生回执。 */
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
  // 用量入账（生产=sqlite 写）绝不反噬判定：写失败降级为日志。否则成功判定
  // 会被伪装成 ok:false（影子账本污染）、持续失败时 ask 直接 reject 穿透
  // 消费方——击穿「网关不抛」纪律（2026-09-27 审查 P2-3）。
  const recordUsage = (r: Parameters<NonNullable<JudgmentGatewayDeps['onUsage']>>[0]): void => {
    try {
      deps.onUsage?.(r);
    } catch (e) {
      deps.log?.(`[judgment] usage accounting failed (ignored): ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  const judgeFor = (cfg: JudgmentConfig): Judge | null => {
    // 缓存键含 timeout_ms：只调超时（如 15s→5s 应对 provider 变慢）也要重建，
    // 否则旧超时一直用到其他字段变化——违背热读「改文件即时生效」承诺。
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
      // mode 与 threshold 同源这一次 load，随结果一并返回——消费方以 outcome
      // 为准、不再各自重读配置，热改落在多次读之间的 TOCTOU 窗口就此收口。
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
        // 按问题键取答案（多问响应不静默错配到「第一个值」）。逐题做极性映射，
        // 顶层 legacy 字段=第一个问题的答案（既有单问消费方零改动）。
        const answerOf = (a: unknown): { answer?: string; confidence?: number; probabilities?: Readonly<Record<string, number>> } => {
          const first = a as
            | { choice?: string; confidence?: number; probabilities?: Readonly<Record<string, number>>; noul?: number }
            | undefined;
          if (typeof first?.noul === 'number') {
            // noul 极性（plan.ts 钉死）= P(答案为是)。confidence 是**所选答案**
            // 的概率：判 'false'（不值得起单）时取 1-noul——模型自信拒绝必须能过
            // 消费方阈值，否则「answer==='false' && confidence>=0.7」是空集，
            // on 模式一张单也拦不下（P1）。probabilities 补全两极供影子期评估。
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
        // 失败调用也入账（tokens 0）：成本账本同时是「判定试了多少次」的
        // 运营面——静默失败在影子期会伪装成「零成本零运行」。
        recordUsage({
          scenario, mode, model: judge.model, inputTokens: 0, outputTokens: 0,
          durationMs, ok: false, error: msg.slice(0, 80),
        });
        deps.log?.(`[judgment] ${scenario} judgment failed (default behavior applies): ${msg}`);
        // 错误串含远端可控的响应体片段，账本是审计面——落账只留前 80 字符，
        // 完整诊断在上面这行日志。
        return { ...base, ok: false, error: msg.slice(0, 80) };
      }
    },
  };
};
