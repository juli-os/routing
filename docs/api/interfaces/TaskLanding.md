[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / TaskLanding

# Interface: TaskLanding

Defined in: [business/routing/routeTask.ts:12](https://github.com/juli-os/routing/blob/main/src/business/routing/routeTask.ts#L12)

## Properties

### diverted

> `readonly` **diverted**: `boolean`

Defined in: [business/routing/routeTask.ts:21](https://github.com/juli-os/routing/blob/main/src/business/routing/routeTask.ts#L21)

忙闲改道发生过。

***

### ideal

> `readonly` **ideal**: `string`

Defined in: [business/routing/routeTask.ts:19](https://github.com/juli-os/routing/blob/main/src/business/routing/routeTask.ts#L19)

jev/default 给出的理想落点（忙闲改道前的值；diverted 时 ≠ session）。

***

### note

> `readonly` **note**: `string`

Defined in: [business/routing/routeTask.ts:15](https://github.com/juli-os/routing/blob/main/src/business/routing/routeTask.ts#L15)

人话注记（计划卡/日志显示，如「juli-reply 忙 → 改道 juli-dev」）。

***

### session

> `readonly` **session**: `string`

Defined in: [business/routing/routeTask.ts:13](https://github.com/juli-os/routing/blob/main/src/business/routing/routeTask.ts#L13)

***

### via

> `readonly` **via**: `"default"` \| `"jev"`

Defined in: [business/routing/routeTask.ts:17](https://github.com/juli-os/routing/blob/main/src/business/routing/routeTask.ts#L17)

判定来源：jev 内容判定 or default 兜底。
