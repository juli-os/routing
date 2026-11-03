[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / JevResult

# Interface: JevResult

Defined in: [business/routing/jev.ts:26](https://github.com/juli-os/routing/blob/main/src/business/routing/jev.ts#L26)

## Properties

### answers

> `readonly` **answers**: `Readonly`\<`Record`\<`string`, [`JevAnswer`](../type-aliases/JevAnswer.md)\>\>

Defined in: [business/routing/jev.ts:28](https://github.com/juli-os/routing/blob/main/src/business/routing/jev.ts#L28)

***

### model

> `readonly` **model**: `string`

Defined in: [business/routing/jev.ts:27](https://github.com/juli-os/routing/blob/main/src/business/routing/jev.ts#L27)

***

### usage

> `readonly` **usage**: `object`

Defined in: [business/routing/jev.ts:29](https://github.com/juli-os/routing/blob/main/src/business/routing/jev.ts#L29)

#### cached\_tokens?

> `readonly` `optional` **cached\_tokens?**: `number`

z.ai 兼容（wf_66a9b632154d）：缓存命中——openai 形态 prompt_tokens_details.cached_tokens
 或智谱原生 cached_tokens；本地/CLI 兜底为 0。

#### input\_tokens

> `readonly` **input\_tokens**: `number`

#### output\_tokens

> `readonly` **output\_tokens**: `number`

#### prompt\_tokens\_details?

> `readonly` `optional` **prompt\_tokens\_details?**: `object`

##### prompt\_tokens\_details.cached\_tokens?

> `readonly` `optional` **cached\_tokens?**: `number`
