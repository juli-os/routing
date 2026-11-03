[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / routeTaskMenu

# Function: routeTaskMenu()

> **routeTaskMenu**(`routing`): readonly [`AgentDecl`](../interfaces/AgentDecl.md)[]

Defined in: [business/routing/routeTask.ts:36](https://github.com/juli-os/routing/blob/main/src/business/routing/routeTask.ts#L36)

候选菜单：非绑定 + 非 high 孪生的声明会话。绑定会话只认白名单地址
（session_bound 守卫拒派，进菜单=造死单）；high 档是成本改道落点，不做
内容路由目标（「非必要不高智能」）。chat 的可钉名单同源（runtime 复用）。

## Parameters

### routing

[`Routing`](../interfaces/Routing.md)

## Returns

readonly [`AgentDecl`](../interfaces/AgentDecl.md)[]
