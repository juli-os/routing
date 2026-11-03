[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / RoutingPlan

# Interface: RoutingPlan

Defined in: [business/routing/plan.ts:60](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L60)

## Properties

### crossRouteDups

> `readonly` **crossRouteDups**: readonly `object`[]

Defined in: [business/routing/plan.ts:68](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L68)

同根因但判定路由不同（或一方未定）——不合并，显性上浮。

***

### dryRun

> `readonly` **dryRun**: `true`

Defined in: [business/routing/plan.ts:61](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L61)

***

### groups

> `readonly` **groups**: readonly [`PlanGroup`](PlanGroup.md)[]

Defined in: [business/routing/plan.ts:65](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L65)

***

### model

> `readonly` **model**: `string`

Defined in: [business/routing/plan.ts:62](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L62)

***

### needsHuman

> `readonly` **needsHuman**: readonly [`RoutedTicket`](RoutedTicket.md)[]

Defined in: [business/routing/plan.ts:66](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L66)

***

### passes

> `readonly` **passes**: `number`

Defined in: [business/routing/plan.ts:63](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L63)

***

### stats

> `readonly` **stats**: `object`

Defined in: [business/routing/plan.ts:72](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L72)

#### agreeWithBaseline

> `readonly` **agreeWithBaseline**: `number`

#### crossRouteDups

> `readonly` **crossRouteDups**: `number`

#### groups

> `readonly` **groups**: `number`

#### merged

> `readonly` **merged**: `number`

#### tickets

> `readonly` **tickets**: `number`

#### unresolved

> `readonly` **unresolved**: `number`

***

### usage

> `readonly` **usage**: `object`

Defined in: [business/routing/plan.ts:64](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L64)

#### inputTokens

> `readonly` **inputTokens**: `number`

#### outputTokens

> `readonly` **outputTokens**: `number`
