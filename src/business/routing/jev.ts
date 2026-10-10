// Jev (TypeSafe System One) judgment client: the transport provider for
// semantic judgment. It only does transport and response shape validation —
// question construction/thresholds/passes live with the consumers (plan.ts,
// the judgment.ts gateway); zero engine changes. Credentials = env JEV_TOKEN
// (injected by the user's shell, never held by the engine; TYPESAFE_API_KEY
// as fallback). Egress boundary (updated 2026-09-23): the old discipline
// "jev only on the CLI dry-run surface, never per intake email" is now
// enforced by the judgment gateway — scenario-level off/shadow/on hot
// switches (judgment.json) adjudicate which paths may reach the network
// (route_fallback fallback leg, intake_gate case-opening gate, etc.); the
// default config = all scenarios off, zero network; this file no longer
// draws its own security boundary. The Judge port is pluggable — inject a
// fake judge in tests for zero network.

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
    /** z.ai compatibility (wf_66a9b632154d): cache hits — OpenAI-style
     *  prompt_tokens_details.cached_tokens or Zhipu-native cached_tokens;
     *  local/CLI falls back to 0. */
    readonly cached_tokens?: number;
    readonly prompt_tokens_details?: { readonly cached_tokens?: number };
  };
}

/** Judgment provider port (pluggable): plan.ts only knows this interface,
 * not Jev itself. */
export interface Judge {
  readonly model: string;
  ask(state: unknown, questions: Readonly<Record<string, JevQuestion>>): Promise<JevResult>;
}

/** Token resolution: JEV_TOKEN first, TYPESAFE_API_KEY as fallback. */
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
