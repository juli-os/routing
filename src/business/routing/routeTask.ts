// 任务路由（2026-09-30 用户裁定「所有的都走路由」）：无键起单的落点判定
// ——chat 计划暂存与 HTTP /api/lifecycle/tasks 兜底共用一个入口。分层裁定
// （0930 对话定案）：路由决定只住在 routing 层（本函数），input 层只转述
// 用户钉住或调用本函数，绝不自选会话。
// 优先级：显式钉住（调用方处理，不经本函数——钉住不改道宁可排队）>
// jev 内容判定 > 忙闲改道（同公司空闲优先）> default 兜底。
// 忙 = 名下存在非终态单（含排队/停在闸门等批准，0930 忙闲重定义）。

import type { AgentDecl, Routing } from './decision.ts';
import type { JudgmentGateway } from '../../contracts/ports.ts';

export interface TaskLanding {
  readonly session: string;
  /** 人话注记（计划卡/日志显示，如「juli-reply 忙 → 改道 juli-dev」）。 */
  readonly note: string;
  /** 判定来源：jev 内容判定 or default 兜底。 */
  readonly via: 'jev' | 'default';
  /** jev/default 给出的理想落点（忙闲改道前的值；diverted 时 ≠ session）。 */
  readonly ideal: string;
  /** 忙闲改道发生过。 */
  readonly diverted: boolean;
}

export interface RouteTaskDeps {
  readonly routing: Routing;
  readonly judgment?: JudgmentGateway;
  /** 忙闲谓词（生产 = store.sessionHasOpenWork）。 */
  readonly busySession: (session: string) => boolean;
  /** tmux 真实存在的会话（改道候选须真身存在，与派发面同纪律；缺省不校验）。 */
  readonly availableSessions?: readonly string[];
}

/** 候选菜单：非绑定 + 非 high 孪生的声明会话。绑定会话只认白名单地址
 * （session_bound 守卫拒派，进菜单=造死单）；high 档是成本改道落点，不做
 * 内容路由目标（「非必要不高智能」）。chat 的可钉名单同源（runtime 复用）。 */
export const routeTaskMenu = (routing: Routing): readonly AgentDecl[] => {
  const bound = new Set((routing.boundAgents ?? []).map((b) => b.session));
  return (routing.agents ?? []).filter((a) =>
    a.session.trim() !== '' && !bound.has(a.session) && a.model_tier !== 'high');
};

/** 无键起单落点判定（fail-open：判定挂/off/低置信=既有 default 行为）。 */
export const routeTask = async (title: string, brief: string, deps: RouteTaskDeps): Promise<TaskLanding> => {
  const def = deps.routing.defaultSession;
  const menu = routeTaskMenu(deps.routing);
  if (menu.length === 0) {
    return { session: def, note: 'no candidate declared session, default routing', via: 'default', ideal: def, diverted: false };
  }
  // jev 内容判定（route_intake 同场景，邮件线共用）：on + 过阈值 + 答案在
  // 菜单内 + **tmux 活性**（十一跑 P2-3：判中离线声明会话就采纳=把落点钉进
  // 离线会话，派发面 resolveSession 静默兜回 default 且钉住跟着走——计划卡
  // 承诺失真。离线视同 fail-open：落 default，忙时照旧可改道）；shadow/off/
  // 失败零行为变化。
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
      // 活性校验不过（availableSessions 缺省时不校验=旧行为）：判中了但会话
      // 离线——不采纳，note 如实留痕（计划卡看得见为什么落 default）。
      offlineHit = outcome.answer!;
    }
  }
  // 忙闲感知（0930）：理想落点忙 → 空闲声明会话（同公司优先，其次跨公司）；
  // 全忙 → 落理想会话排队。候选真身须存在于 tmux（与派发面 idleOf 同源）。
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
