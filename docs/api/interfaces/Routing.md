[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / Routing

# Interface: Routing

Defined in: [business/routing/decision.ts:14](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L14)

## Properties

### agents?

> `readonly` `optional` **agents?**: readonly [`AgentDecl`](AgentDecl.md)[]

Defined in: [business/routing/decision.ts:25](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L25)

可选：agents 全量声明（生产来自 config.agents）——组织树两维的
唯一结构源；route_decision 的 company/domain 判定从这里读。

***

### boundAgents?

> `readonly` `optional` **boundAgents?**: readonly [`BoundAgent`](BoundAgent.md)[]

Defined in: [business/routing/decision.ts:22](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L22)

可选：绑定会话表（生产来自 config.email.bound_agents）。

***

### defaultProject

> `readonly` **defaultProject**: `string`

Defined in: [business/routing/decision.ts:16](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L16)

***

### defaultSession

> `readonly` **defaultSession**: `string`

Defined in: [business/routing/decision.ts:15](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L15)

***

### internalDomains?

> `readonly` `optional` **internalDomains?**: readonly `string`[]

Defined in: [business/routing/decision.ts:20](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L20)

内部域（自家域，e.g. acme.example）：内部判定=绑定白名单精确地址 ∪ 本域。
agents.senders 是客户发件域声明（路由匹配用），绝不算内部——曾把主客户
联系人吞进内部桶（2026-09-22 线上事故）。
