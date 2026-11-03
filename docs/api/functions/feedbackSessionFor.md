[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / feedbackSessionFor

# Function: feedbackSessionFor()

> **feedbackSessionFor**(`r`, `routing`): `string`

Defined in: [business/intake/feedbackIntake.ts:15](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackIntake.ts#L15)

纯函数：记录 → 目标会话。无命中返回 ''（调用方交给引擎 defaultSession 兜底）。

## Parameters

### r

[`FbRecord`](../interfaces/FbRecord.md)

### routing

[`FeedbackRouting`](../interfaces/FeedbackRouting.md) \| `undefined`

## Returns

`string`
