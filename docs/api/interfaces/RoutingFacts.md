[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / RoutingFacts

# Interface: RoutingFacts

Defined in: [business/routing/plan.ts:27](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L27)

计划事实：声明 + 规则 + 兜底 +（可选）mesh 忙闲投影。

## Properties

### agents

> `readonly` **agents**: readonly [`RouteAgent`](RouteAgent.md)[]

Defined in: [business/routing/plan.ts:28](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L28)

***

### defaultSession

> `readonly` **defaultSession**: `string`

Defined in: [business/routing/plan.ts:30](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L30)

***

### live?

> `readonly` `optional` **live?**: `Readonly`\<`Record`\<`string`, \{ `live`: `boolean`; `working`: `boolean`; \}\>\>

Defined in: [business/routing/plan.ts:32](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L32)

session → 忙闲/活态（GET /api/agents/graph 投影；缺省不显示）。

***

### rules

> `readonly` **rules**: readonly `object`[]

Defined in: [business/routing/plan.ts:29](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L29)
