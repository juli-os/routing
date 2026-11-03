[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / createJudgeFromConfig

# Function: createJudgeFromConfig()

> **createJudgeFromConfig**(`cfg`, `env?`): [`Judge`](../interfaces/Judge.md) \| `null`

Defined in: [business/routing/judgment.ts:190](https://github.com/juli-os/routing/blob/main/src/business/routing/judgment.ts#L190)

按配置挑提供方。缺凭证/缺 url/缺 cmd → null（网关降级为全 off）。

## Parameters

### cfg

[`JudgmentConfig`](../interfaces/JudgmentConfig.md)

### env?

`Readonly`\<`Record`\<`string`, `string` \| `undefined`\>\> = `process.env`

## Returns

[`Judge`](../interfaces/Judge.md) \| `null`
