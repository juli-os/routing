[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / JudgmentGatewayDeps

# Interface: JudgmentGatewayDeps

Defined in: [business/routing/judgment.ts:220](https://github.com/juli-os/routing/blob/main/src/business/routing/judgment.ts#L220)

## Properties

### judgeOf

> `readonly` **judgeOf**: (`cfg`) => [`Judge`](Judge.md) \| `null`

Defined in: [business/routing/judgment.ts:224](https://github.com/juli-os/routing/blob/main/src/business/routing/judgment.ts#L224)

Judge 构建（配置变化时重建；token 在此读 env）。

#### Parameters

##### cfg

[`JudgmentConfig`](JudgmentConfig.md)

#### Returns

[`Judge`](Judge.md) \| `null`

***

### load

> `readonly` **load**: () => [`JudgmentConfig`](JudgmentConfig.md) \| `null`

Defined in: [business/routing/judgment.ts:222](https://github.com/juli-os/routing/blob/main/src/business/routing/judgment.ts#L222)

热读配置（生产 = () => loadJudgmentConfig(path)）。

#### Returns

[`JudgmentConfig`](JudgmentConfig.md) \| `null`

***

### log?

> `readonly` `optional` **log?**: (`m`) => `void`

Defined in: [business/routing/judgment.ts:239](https://github.com/juli-os/routing/blob/main/src/business/routing/judgment.ts#L239)

#### Parameters

##### m

`string`

#### Returns

`void`

***

### onUsage?

> `readonly` `optional` **onUsage?**: (`r`) => `void`

Defined in: [business/routing/judgment.ts:228](https://github.com/juli-os/routing/blob/main/src/business/routing/judgment.ts#L228)

用量回执（生产 = usage.record 进 prompt_usage——判定成本与编排器/CC
同一本账；失败调用也记：tokens 为 0、error 留诊断）。off/提供方不可用
不出网，不产生回执。

#### Parameters

##### r

###### cachedTokens?

`number`

###### durationMs

`number`

###### error?

`string`

###### inputTokens

`number`

###### mode

`"shadow"` \| `"on"`

###### model

`string`

###### ok

`boolean`

###### outputTokens

`number`

###### scenario

[`JudgmentScenario`](../type-aliases/JudgmentScenario.md)

#### Returns

`void`
