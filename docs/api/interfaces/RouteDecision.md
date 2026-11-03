[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / RouteDecision

# Interface: RouteDecision

Defined in: [business/routing/decision.ts:48](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L48)

route_decision 事件负载（板B/D）：链路 + 每跳原因 + 是否落回。
纯投影数据——进 events 账本与 workflow.meta 各一份（iOS 案卷详情读
meta 渲染链路卡，Agents tab 读事件渲染最近分发）。

## Properties

### chain

> `readonly` **chain**: readonly `string`[]

Defined in: [business/routing/decision.ts:53](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L53)

***

### company

> `readonly` **company**: `string`

Defined in: [business/routing/decision.ts:50](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L50)

***

### domain

> `readonly` **domain**: `string`

Defined in: [business/routing/decision.ts:51](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L51)

***

### fallback

> `readonly` **fallback**: `boolean`

Defined in: [business/routing/decision.ts:55](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L55)

***

### from

> `readonly` **from**: `string`

Defined in: [business/routing/decision.ts:49](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L49)

***

### reasons

> `readonly` **reasons**: `Readonly`\<`Record`\<`string`, `string`\>\>

Defined in: [business/routing/decision.ts:54](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L54)

***

### session

> `readonly` **session**: `string`

Defined in: [business/routing/decision.ts:52](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L52)
