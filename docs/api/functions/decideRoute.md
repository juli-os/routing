[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / decideRoute

# Function: decideRoute()

> **decideRoute**(`from`, `routing`): [`RouteDecision`](../interfaces/RouteDecision.md)

Defined in: [business/routing/decision.ts:60](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L60)

路由判定：authz → company → domain → bound/sender_domain/default
（2026-09-30：非绑定的域命中改道到认领声明会话；jev 内容判定在消费侧覆盖）。

## Parameters

### from

`string`

### routing

[`Routing`](../interfaces/Routing.md)

## Returns

[`RouteDecision`](../interfaces/RouteDecision.md)
