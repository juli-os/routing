// 判定端口：本文件只保留语义判定契约（场景联合 + 网关形状）——routing 是
// 纯路由面，不拥有引擎状态转变。此处曾整份克隆引擎端口（Llm/Mailer/
// Pusher/Dispatcher/...）与 ledger 领域模型：包内零调用方、facade 不导出
// （消费方各自持有真理），2026-10 R8 审查删除——两个独立发版仓各持一份
// 领域模型，只会在对侧演进时静默过期。

/** 判定场景（细粒度开关的粒度）：每个场景可独立 off/shadow/on（judgment.json）。 */
export type JudgmentScenario =
  | 'route_intake'    // 邮件进件第一跳：内容判定落哪个声明会话（规则腿降为兜底）
  | 'route_fallback'  // 路由兜底腿：规则链全未命中时选声明会话
  | 'intake_gate'     // 起单价值判定：这条进件值不值得开单
  | 'align_needed'    // 对齐必要性预筛（预留）
  | 'aggregate_same'  // feedback 同因聚合（预留）
  | 'handoff_domain'  // 转派 domain 判定（预留）
  | 'output_quality'  // 产出合格性预检（预留）
  | 'redline_semantic'// 红线语义体检（预留）
  | 'triage_classify' // 邮件 triage：category/needs_reply 类型化判定（summary 留 LLM）
  | 'mount_infer'     // feedback 挂载推断（预留）
  | 'task_tier'       // 任务难度档位判定：title+brief 配不配高智能档（false=standard 更省）
  | 'alert_grade';    // 告警分级降噪（预留）

/** 场景全集的运行时镜像（judgment.json 是人工热读面——拼错的场景键必须能被
 * 识别丢弃，否则「以为在影子期攒数据、实际该场景从未出网」零反馈）。围栏
 * 双向：satisfies 防名单多出未知成员，Exhaustive 断言防联合新增成员漏进
 * 名单（单向注解只防多不防漏，71af31d 加 task_tier 时曾靠手工同步）。 */
export const JUDGMENT_SCENARIOS = [
  'route_intake', 'route_fallback', 'intake_gate', 'align_needed', 'aggregate_same', 'handoff_domain',
  'output_quality', 'redline_semantic', 'triage_classify', 'mount_infer', 'task_tier', 'alert_grade',
] as const satisfies readonly JudgmentScenario[];
/** 联合新增场景而未进 JUDGMENT_SCENARIOS 时，此行编译报错（drift fence）：
 * Exclude 残留成员 → 类型坍缩为 never → true 不可赋值。 */
const _judgmentScenariosExhaustive: Exclude<JudgmentScenario, (typeof JUDGMENT_SCENARIOS)[number]> extends never ? true : never = true;
void _judgmentScenariosExhaustive;

/** 判定问题（结构最小形状——contracts 不依赖 business/routing 的 JevQuestion，
 * 这里与它结构相容，提供方契约解释 instructions/criteria 的具体语义）：
 * noul=是否向 0-1 概率（**极性=P(答案为是)**，plan.ts 钉死）；choice=选项+概率。 */
export type JudgmentQuestion =
  | { readonly type: 'noul'; readonly instructions: unknown; readonly criteria?: unknown }
  | { readonly type: 'choice'; readonly instructions: unknown; readonly criteria: unknown };

/** 判定网关（消费方只认这个）：模式裁断在网关（off 直接 null，不产生网络）；
 * shadow=照常判定留痕但结果不生效；on=结果可被消费方采用（消费方仍须按
 * 引擎侧规则校验答案——「typed judgment 只做输入，决定留引擎」）。 */
export interface JudgmentGateway {
  /** 采纳阈值（config.min_confidence，**全局单值**默认 0.7）：on 模式下置信度
   * 低于它的答案消费方必须拒绝（降级默认行为）。无场景参数——场景级的是
   * off/shadow/on，阈值不是，勿误读为可按场景配置。 */
  threshold(): number;
  /** 执行判定。off → null（调用方零成本跳过）；网关不抛——网络/配置失败
   * 降级为 error 结果，消费方按默认行为走（jev 挂了不许挂管线）。 */
  ask(scenario: JudgmentScenario, state: unknown, questions: Readonly<Record<string, JudgmentQuestion>>):
    Promise<JudgmentOutcome | null>;
}

export interface JudgmentOutcome {
  readonly mode: 'shadow' | 'on';
  readonly ok: boolean;
  /** 本次判定所用配置裁断出的采纳阈值：与 mode 同源同一次 load——消费方
   * 以此为准、勿再自行读配置（热改落在多次读之间的 TOCTOU 就此收口）。 */
  readonly threshold: number;
  /** ok=true 时的判定结果（choice 选项 / noul 0-1 概率映射出的 'true'/'false'）。 */
  readonly answer?: string;
  readonly confidence?: number;
  readonly probabilities?: Readonly<Record<string, number>>;
  /** 多问时的全量答案（键=问题键，值与 answer/confidence 同构）。单问消费方
   * 可忽略；legacy 顶层 answer/confidence 恒等于**第一个问题**的答案（兼容
   * 既有两消费点）。triage_classify 一调多问（category+needs_reply）靠它。 */
  readonly answers?: Readonly<Record<string, { readonly answer?: string; readonly confidence?: number }>>;
  readonly provider: string;
  readonly error?: string;
  /** 用量回执（成本账本输入）：ok=true 时来自判定响应的真实 usage；
   * 失败/off 缺省。消费方可透传进留痕事件供后续分析。 */
  readonly model?: string;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  /** z.ai 计费口径的缓存命中 token（wf_66a9b632154d）：cached_tokens，
   * input_tokens 的子集——命中率=cached/input。 */
  readonly cachedTokens?: number;
  readonly durationMs?: number;
}
