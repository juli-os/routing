[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / JudgmentOutcome

# Interface: JudgmentOutcome

Defined in: [contracts/ports.ts:56](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L56)

## Properties

### answer?

> `readonly` `optional` **answer?**: `string`

Defined in: [contracts/ports.ts:63](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L63)

ok=true 时的判定结果（choice 选项 / noul 0-1 概率映射出的 'true'/'false'）。

***

### answers?

> `readonly` `optional` **answers?**: `Readonly`\<`Record`\<`string`, \{ `answer?`: `string`; `confidence?`: `number`; \}\>\>

Defined in: [contracts/ports.ts:69](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L69)

多问时的全量答案（键=问题键，值与 answer/confidence 同构）。单问消费方
可忽略；legacy 顶层 answer/confidence 恒等于**第一个问题**的答案（兼容
既有两消费点）。triage_classify 一调多问（category+needs_reply）靠它。

***

### cachedTokens?

> `readonly` `optional` **cachedTokens?**: `number`

Defined in: [contracts/ports.ts:79](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L79)

z.ai 计费口径的缓存命中 token（wf_66a9b632154d）：cached_tokens，
input_tokens 的子集——命中率=cached/input。

***

### confidence?

> `readonly` `optional` **confidence?**: `number`

Defined in: [contracts/ports.ts:64](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L64)

***

### durationMs?

> `readonly` `optional` **durationMs?**: `number`

Defined in: [contracts/ports.ts:80](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L80)

***

### error?

> `readonly` `optional` **error?**: `string`

Defined in: [contracts/ports.ts:71](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L71)

***

### inputTokens?

> `readonly` `optional` **inputTokens?**: `number`

Defined in: [contracts/ports.ts:75](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L75)

***

### mode

> `readonly` **mode**: `"shadow"` \| `"on"`

Defined in: [contracts/ports.ts:57](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L57)

***

### model?

> `readonly` `optional` **model?**: `string`

Defined in: [contracts/ports.ts:74](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L74)

用量回执（成本账本输入）：ok=true 时来自判定响应的真实 usage；
失败/off 缺省。消费方可透传进留痕事件供后续分析。

***

### ok

> `readonly` **ok**: `boolean`

Defined in: [contracts/ports.ts:58](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L58)

***

### outputTokens?

> `readonly` `optional` **outputTokens?**: `number`

Defined in: [contracts/ports.ts:76](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L76)

***

### probabilities?

> `readonly` `optional` **probabilities?**: `Readonly`\<`Record`\<`string`, `number`\>\>

Defined in: [contracts/ports.ts:65](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L65)

***

### provider

> `readonly` **provider**: `string`

Defined in: [contracts/ports.ts:70](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L70)

***

### threshold

> `readonly` **threshold**: `number`

Defined in: [contracts/ports.ts:61](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L61)

本次判定所用配置裁断出的采纳阈值：与 mode 同源同一次 load——消费方
以此为准、勿再自行读配置（热改落在多次读之间的 TOCTOU 就此收口）。
