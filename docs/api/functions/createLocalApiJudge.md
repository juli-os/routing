[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / createLocalApiJudge

# Function: createLocalApiJudge()

> **createLocalApiJudge**(`opts`): [`Judge`](../interfaces/Judge.md)

Defined in: [business/routing/judgment.ts:100](https://github.com/juli-os/routing/blob/main/src/business/routing/judgment.ts#L100)

local-api：任意实现 {state,model,questions} → {answers} 契约的 HTTP 端点
（本地部署 jev 时指过来即可，响应形状与云端一致）。

## Parameters

### opts

#### fetchImpl?

\{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}

#### model?

`string`

#### timeoutMs?

`number`

#### url

`string`

## Returns

[`Judge`](../interfaces/Judge.md)
