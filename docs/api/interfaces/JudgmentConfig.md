[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / JudgmentConfig

# Interface: JudgmentConfig

Defined in: [business/routing/judgment.ts:15](https://github.com/juli-os/routing/blob/main/src/business/routing/judgment.ts#L15)

## Properties

### cli?

> `readonly` `optional` **cli?**: `object`

Defined in: [business/routing/judgment.ts:19](https://github.com/juli-os/routing/blob/main/src/business/routing/judgment.ts#L19)

#### cmd

> `readonly` **cmd**: readonly `string`[]

***

### cloud?

> `readonly` `optional` **cloud?**: `object`

Defined in: [business/routing/judgment.ts:17](https://github.com/juli-os/routing/blob/main/src/business/routing/judgment.ts#L17)

#### baseUrl?

> `readonly` `optional` **baseUrl?**: `string`

#### model?

> `readonly` `optional` **model?**: `string`

#### token?

> `readonly` `optional` **token?**: `string`

#### tokenEnv?

> `readonly` `optional` **tokenEnv?**: `string`

***

### local\_api?

> `readonly` `optional` **local\_api?**: `object`

Defined in: [business/routing/judgment.ts:18](https://github.com/juli-os/routing/blob/main/src/business/routing/judgment.ts#L18)

#### model?

> `readonly` `optional` **model?**: `string`

#### url

> `readonly` **url**: `string`

***

### min\_confidence?

> `readonly` `optional` **min\_confidence?**: `number`

Defined in: [business/routing/judgment.ts:21](https://github.com/juli-os/routing/blob/main/src/business/routing/judgment.ts#L21)

***

### provider

> `readonly` **provider**: `"cloud"` \| `"local-api"` \| `"cli"`

Defined in: [business/routing/judgment.ts:16](https://github.com/juli-os/routing/blob/main/src/business/routing/judgment.ts#L16)

***

### scenarios?

> `readonly` `optional` **scenarios?**: `Partial`\<`Record`\<[`JudgmentScenario`](../type-aliases/JudgmentScenario.md), `"shadow"` \| `"on"` \| `"off"`\>\>

Defined in: [business/routing/judgment.ts:22](https://github.com/juli-os/routing/blob/main/src/business/routing/judgment.ts#L22)

***

### timeout\_ms?

> `readonly` `optional` **timeout\_ms?**: `number`

Defined in: [business/routing/judgment.ts:20](https://github.com/juli-os/routing/blob/main/src/business/routing/judgment.ts#L20)
