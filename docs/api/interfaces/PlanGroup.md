[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / PlanGroup

# Interface: PlanGroup

Defined in: [business/routing/plan.ts:50](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L50)

## Properties

### confidence

> `readonly` **confidence**: `number`

Defined in: [business/routing/plan.ts:56](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L56)

组内最低置信（并单后整组按最弱一票走）。

***

### live?

> `readonly` `optional` **live?**: `object`

Defined in: [business/routing/plan.ts:57](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L57)

#### live

> `readonly` **live**: `boolean`

#### working

> `readonly` **working**: `boolean`

***

### members

> `readonly` **members**: readonly [`RoutedTicket`](RoutedTicket.md)[]

Defined in: [business/routing/plan.ts:52](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L52)

***

### mergedPairs

> `readonly` **mergedPairs**: readonly `object`[]

Defined in: [business/routing/plan.ts:54](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L54)

本组内被判定同根因、建议并单处理的对。

***

### session

> `readonly` **session**: `string`

Defined in: [business/routing/plan.ts:51](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L51)
