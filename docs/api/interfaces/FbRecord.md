[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / FbRecord

# Interface: FbRecord

Defined in: [business/intake/feedbackMirror.ts:4](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L4)

## Properties

### author\_name

> **author\_name**: `string`

Defined in: [business/intake/feedbackMirror.ts:13](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L13)

***

### author\_role

> **author\_role**: `string`

Defined in: [business/intake/feedbackMirror.ts:14](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L14)

***

### body

> **body**: `string`

Defined in: [business/intake/feedbackMirror.ts:12](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L12)

***

### created

> **created**: `string`

Defined in: [business/intake/feedbackMirror.ts:6](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L6)

***

### element\_label

> **element\_label**: `string`

Defined in: [business/intake/feedbackMirror.ts:16](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L16)

***

### id

> **id**: `string`

Defined in: [business/intake/feedbackMirror.ts:5](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L5)

***

### origin\_actor?

> `optional` **origin\_actor?**: `string`

Defined in: [business/intake/feedbackMirror.ts:22](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L22)

具体创建者身份（审计面：'cyber' / 'juli-dev' / 'mirror-sync'）。

***

### origin\_kind?

> `optional` **origin\_kind?**: [`FbOriginKind`](../type-aliases/FbOriginKind.md)

Defined in: [business/intake/feedbackMirror.ts:20](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L20)

创建者类型（缺省 = legacy 外部记录，视同 human 照旧进件，fail-open 向后兼容）。

***

### origin\_ref?

> `optional` **origin\_ref?**: `string`

Defined in: [business/intake/feedbackMirror.ts:24](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L24)

回链（workflow id / 父记录——追责链闭环）。

***

### page

> **page**: `string`

Defined in: [business/intake/feedbackMirror.ts:10](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L10)

***

### page\_title

> **page\_title**: `string`

Defined in: [business/intake/feedbackMirror.ts:11](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L11)

***

### reply\_to

> **reply\_to**: `string`

Defined in: [business/intake/feedbackMirror.ts:15](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L15)

***

### source?

> `optional` **source?**: `string`

Defined in: [business/intake/feedbackMirror.ts:18](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L18)

来源标识（多源时代 0927；db 读出恒有，remote may omit it）。

***

### status

> **status**: `string`

Defined in: [business/intake/feedbackMirror.ts:8](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L8)

***

### type

> **type**: `string`

Defined in: [business/intake/feedbackMirror.ts:9](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L9)

***

### updated

> **updated**: `string`

Defined in: [business/intake/feedbackMirror.ts:7](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackMirror.ts#L7)
