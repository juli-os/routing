[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / RouteTaskDeps

# Interface: RouteTaskDeps

Defined in: [business/routing/routeTask.ts:24](https://github.com/juli-os/routing/blob/main/src/business/routing/routeTask.ts#L24)

## Properties

### availableSessions?

> `readonly` `optional` **availableSessions?**: readonly `string`[]

Defined in: [business/routing/routeTask.ts:30](https://github.com/juli-os/routing/blob/main/src/business/routing/routeTask.ts#L30)

tmux 真实存在的会话（改道候选须真身存在，与派发面同纪律；缺省不校验）。

***

### busySession

> `readonly` **busySession**: (`session`) => `boolean`

Defined in: [business/routing/routeTask.ts:28](https://github.com/juli-os/routing/blob/main/src/business/routing/routeTask.ts#L28)

忙闲谓词（生产 = store.sessionHasOpenWork）。

#### Parameters

##### session

`string`

#### Returns

`boolean`

***

### judgment?

> `readonly` `optional` **judgment?**: [`JudgmentGateway`](JudgmentGateway.md)

Defined in: [business/routing/routeTask.ts:26](https://github.com/juli-os/routing/blob/main/src/business/routing/routeTask.ts#L26)

***

### routing

> `readonly` **routing**: [`Routing`](Routing.md)

Defined in: [business/routing/routeTask.ts:25](https://github.com/juli-os/routing/blob/main/src/business/routing/routeTask.ts#L25)
