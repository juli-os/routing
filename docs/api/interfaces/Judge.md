[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / Judge

# Interface: Judge

Defined in: [business/routing/jev.ts:39](https://github.com/juli-os/routing/blob/main/src/business/routing/jev.ts#L39)

判定提供方端口（可插拔）：plan.ts 只认这个接口，不认 Jev 本身。

## Properties

### model

> `readonly` **model**: `string`

Defined in: [business/routing/jev.ts:40](https://github.com/juli-os/routing/blob/main/src/business/routing/jev.ts#L40)

## Methods

### ask()

> **ask**(`state`, `questions`): `Promise`\<[`JevResult`](JevResult.md)\>

Defined in: [business/routing/jev.ts:41](https://github.com/juli-os/routing/blob/main/src/business/routing/jev.ts#L41)

#### Parameters

##### state

`unknown`

##### questions

`Readonly`\<`Record`\<`string`, [`JevQuestion`](../type-aliases/JevQuestion.md)\>\>

#### Returns

`Promise`\<[`JevResult`](JevResult.md)\>
