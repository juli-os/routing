// Jev（TypeSafe System One）判定客户端：语义判定的传输提供方。
// 只做传输与响应形状校验——问题构造/阈值/轮次在消费方（plan.ts、judgment.ts
// 网关）；引擎零改动。凭证=env JEV_TOKEN（用户 shell 注入，引擎不持有，
// TYPESAFE_API_KEY 兜底）。出网边界（2026-09-23 更新）：旧纪律「jev 只进
// CLI dry-run 面、不进每封进件」已由 judgment 网关接管——场景级 off/shadow/on
// 热开关（judgment.json）裁断哪些路径允许出网（route_fallback 兜底腿、
// intake_gate 起单门等），配置缺省=全场景 off 零网络；本文件不再自行圈定
// 安全边界。Judge 端口可插拔，测试注入假判定器即零网络。

export interface JevAnswerNoul {
  readonly type: 'noul';
  readonly noul: number;
}
export interface JevAnswerChoice {
  readonly type: 'choice';
  readonly choice: string;
  readonly probabilities: Readonly<Record<string, number>>;
  readonly confidence: number;
}
export type JevAnswer = JevAnswerNoul | JevAnswerChoice;

export type JevQuestion =
  | { readonly type: 'noul'; readonly instructions: unknown; readonly criteria?: unknown }
  | { readonly type: 'choice'; readonly instructions: unknown; readonly criteria: unknown };

export interface JevResult {
  readonly model: string;
  readonly answers: Readonly<Record<string, JevAnswer>>;
  readonly usage: {
    readonly input_tokens: number; readonly output_tokens: number;
    /** z.ai 兼容（wf_66a9b632154d）：缓存命中——openai 形态 prompt_tokens_details.cached_tokens
     *  或智谱原生 cached_tokens；本地/CLI 兜底为 0。 */
    readonly cached_tokens?: number;
    readonly prompt_tokens_details?: { readonly cached_tokens?: number };
  };
}

/** 判定提供方端口（可插拔）：plan.ts 只认这个接口，不认 Jev 本身。 */
export interface Judge {
  readonly model: string;
  ask(state: unknown, questions: Readonly<Record<string, JevQuestion>>): Promise<JevResult>;
}

/** token 解析：JEV_TOKEN 优先，TYPESAFE_API_KEY 兜底。 */
export const jevTokenFromEnv = (
  env: Readonly<Record<string, string | undefined>> = process.env,
): string => env['JEV_TOKEN'] ?? env['TYPESAFE_API_KEY'] ?? '';

export interface JevDeps {
  readonly token: string;
  readonly baseUrl?: string;
  readonly model?: string;
  readonly fetchImpl?: typeof fetch;
  readonly timeoutMs?: number;
}

export const createJev = (deps: JevDeps): Judge => {
  const base = deps.baseUrl ?? 'https://api.typesafe.ai';
  const model = deps.model ?? 'jev-latest';
  const doFetch = deps.fetchImpl ?? fetch;
  return {
    model,
    async ask(state, questions) {
      if (deps.token === '') throw new Error('Jev token is empty (env JEV_TOKEN not set)');
      const res = await doFetch(`${base}/v1/systemone`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${deps.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, model, questions }),
        signal: AbortSignal.timeout(deps.timeoutMs ?? 30_000),
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`Jev API ${res.status}: ${text.slice(0, 200)}` +
          `${res.status === 401 ? ' (token invalid/missing)' : res.status === 429 || res.status === 529 ? ' (rate-limited/overloaded, retry later)' : ''}`);
      }
      let d: Partial<JevResult>;
      try {
        d = JSON.parse(text) as Partial<JevResult>;
      } catch {
        throw new Error(`Jev response is not JSON: ${text.slice(0, 200)}`);
      }
      if (d.answers === null || typeof d.answers !== 'object') {
        throw new Error(`Jev response missing answers: ${text.slice(0, 200)}`);
      }
      return {
        model: d.model ?? model,
        answers: d.answers,
        usage: d.usage ?? { input_tokens: 0, output_tokens: 0 },
      };
    },
  };
};
