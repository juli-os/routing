[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / PlanOptions

# Interface: PlanOptions

Defined in: [business/routing/plan.ts:82](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L82)

## Properties

### bodyLimit?

> `readonly` `optional` **bodyLimit?**: `number`

Defined in: [business/routing/plan.ts:92](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L92)

state 里单条 body 截断长度（第 2 轮 ×2 加料）。默认 500。

***

### confidenceFloor?

> `readonly` `optional` **confidenceFloor?**: `number`

Defined in: [business/routing/plan.ts:86](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L86)

choice 置信下限（低于 → 进下一轮）。默认 0.5。

***

### judge

> `readonly` **judge**: [`Judge`](Judge.md) \| `null`

Defined in: [business/routing/plan.ts:84](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L84)

null = 基线-only（现行规则投影，不判语义）。

***

### maxDupPairs?

> `readonly` `optional` **maxDupPairs?**: `number`

Defined in: [business/routing/plan.ts:94](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L94)

合并候选对上限（防 O(n²) 膨胀）。默认 40。

***

### maxPasses?

> `readonly` `optional` **maxPasses?**: `number`

Defined in: [business/routing/plan.ts:90](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L90)

收敛轮数上限（超出 → 显性 needsHuman，不瞎兜底）。默认 2。

***

### mergeFloor?

> `readonly` `optional` **mergeFloor?**: `number`

Defined in: [business/routing/plan.ts:88](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L88)

noul 合并阈值。默认 0.6。
