[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / isInternalSender

# Function: isInternalSender()

> **isInternalSender**(`from`, `routing`): `boolean`

Defined in: [business/routing/decision.ts:123](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L123)

内部发件人判定（第三期 Party 线）：发件域命中 internalDomains（自家域，
见 Routing.internalDomains 契约），或精确命中 bound_agents 白名单地址 →
内部。内部地址不查 CRM、不进客户投影。agents.senders 是客户发件域声明
（路由匹配用），绝不算内部（2026-09-22 事故）。

## Parameters

### from

`string`

### routing

[`Routing`](../interfaces/Routing.md)

## Returns

`boolean`
