// 路由判定（板B 决策链，纯函数可回放）：规则确定性——分类给输入，声明表给
// 路由，LLM 不参与路由。引擎进件（startEmailWorkflow）与 party 投影、web/CLI
// 的审计视图共用本单一事实源。

/** 绑定会话（专用 agent 隔离）：session 名 + 自建 cwd + 白名单发件人。
 * 只有白名单发件人的邮件能把单子路由进绑定会话；其余通道（web/CLI/agent
 * 步钉）一律被 runAgentStep 的 session_bound 守卫拒派。 */
export interface BoundAgent {
  readonly session: string;
  readonly cwd: string;
  readonly senders: readonly string[];
}

export interface Routing {
  readonly defaultSession: string;
  readonly defaultProject: string;
  /** 内部域（自家域，e.g. acme.example）：内部判定=绑定白名单精确地址 ∪ 本域。
   * agents.senders 是客户发件域声明（路由匹配用），绝不算内部——曾把主客户
   * a customer contact was once swallowed into the internal bucket (live incident 2026-09-22)。 */
  readonly internalDomains?: readonly string[];
  /** 可选：绑定会话表（生产来自 config.email.bound_agents）。 */
  readonly boundAgents?: readonly BoundAgent[];
  /** 可选：agents 全量声明（生产来自 config.agents）——组织树两维的
   * 唯一结构源；route_decision 的 company/domain 判定从这里读。 */
  readonly agents?: readonly AgentDecl[];
}

/** agents.yaml 声明段里的一条（config.agents）。 */
export interface AgentDecl {
  readonly session: string;
  readonly company: string;
  readonly domain: string;
  /** 发件域声明（公司匹配的输入之一；绑定语义仍在 bound_agents）。 */
  readonly senders?: readonly string[];
  readonly cwd?: string;
  /** 一句话业务描述（config.agents 声明；jev 路由菜单/钉住清单的判定与
   * 显示质量杠杆——company/domain 两词太瘦）。 */
  readonly description?: string;
  /** 模型档位（2026-09-28 用户裁定「非必要不高智能」）：standard=默认全档，
   * high=冷启动引导时带 --model 高档 id；input.model_tier='high' 的任务在
   * 路由时改道 high 声明会话（同 cwd 孪生优先）。缺省 standard。 */
  readonly model_tier?: 'standard' | 'high';
}

/** route_decision 事件负载（板B/D）：链路 + 每跳原因 + 是否落回。
 * 纯投影数据——进 events 账本与 workflow.meta 各一份（iOS 案卷详情读
 * meta 渲染链路卡，Agents tab 读事件渲染最近分发）。 */
export interface RouteDecision {
  readonly from: string;
  readonly company: string;
  readonly domain: string;
  readonly session: string;
  readonly chain: readonly string[];
  readonly reasons: Readonly<Record<string, string>>;
  readonly fallback: boolean;
}

/** 路由判定：authz → company → domain → bound/sender_domain/default
 * （2026-09-30：非绑定的域命中改道到认领声明会话；jev 内容判定在消费侧覆盖）。 */
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
  // 非绑定：发件域对声明 senders 的域匹配(contact@client.example → client decl)。
  // 2026-09-30 用户裁定「所有的都走路由」：域命中从「只标注公司」升级为真
  // 改道——认领该发件域的非绑定声明会话即落点。绑定会话跳过（它们只认
  // 白名单地址，域腿把同域其他发件人送进去会被 session_bound 守卫拒派）。
  // jev 内容判定（intake.ts）在本腿之上：置信够=内容赢粗域。未命中落默认。
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

/** 内部发件人判定（第三期 Party 线）：复用现有声明表与 decideRoute 同一套域
 * 匹配规则——发件域命中 config.agents 声明 senders 的域，或精确命中
 * bound_agents 地址 → 内部。内部地址不查 CRM、不进客户投影。 */
export const isInternalSender = (from: string, routing: Routing): boolean => {
  const email = from.trim().toLowerCase();
  const dom = email.split('@')[1] ?? '';
  if (dom === '') return false;
  if ((routing.internalDomains ?? []).some((d) => d.toLowerCase() === dom)) return true;
  return (routing.boundAgents ?? []).some((b) =>
    b.senders.some((s) => s.trim().toLowerCase() === email));
};
