[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / routeTask

# Function: routeTask()

> **routeTask**(`title`, `brief`, `deps`): `Promise`\<[`TaskLanding`](../interfaces/TaskLanding.md)\>

Defined in: [business/routing/routeTask.ts:43](https://github.com/juli-os/routing/blob/main/src/business/routing/routeTask.ts#L43)

无键起单落点判定（fail-open：判定挂/off/低置信=既有 default 行为）。

## Parameters

### title

`string`

### brief

`string`

### deps

[`RouteTaskDeps`](../interfaces/RouteTaskDeps.md)

## Returns

`Promise`\<[`TaskLanding`](../interfaces/TaskLanding.md)\>
