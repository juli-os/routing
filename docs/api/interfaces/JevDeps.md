[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / JevDeps

# Interface: JevDeps

Defined in: [business/routing/jev.ts:49](https://github.com/juli-os/routing/blob/main/src/business/routing/jev.ts#L49)

## Properties

### baseUrl?

> `readonly` `optional` **baseUrl?**: `string`

Defined in: [business/routing/jev.ts:51](https://github.com/juli-os/routing/blob/main/src/business/routing/jev.ts#L51)

***

### fetchImpl?

> `readonly` `optional` **fetchImpl?**: \{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}

Defined in: [business/routing/jev.ts:53](https://github.com/juli-os/routing/blob/main/src/business/routing/jev.ts#L53)

#### Call Signature

> (`input`, `init?`): `Promise`\<`Response`\>

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

###### input

`URL` \| `RequestInfo`

###### init?

`RequestInit`

##### Returns

`Promise`\<`Response`\>

#### Call Signature

> (`input`, `init?`): `Promise`\<`Response`\>

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

###### input

`string` \| `URL` \| `Request`

###### init?

`RequestInit`

##### Returns

`Promise`\<`Response`\>

***

### model?

> `readonly` `optional` **model?**: `string`

Defined in: [business/routing/jev.ts:52](https://github.com/juli-os/routing/blob/main/src/business/routing/jev.ts#L52)

***

### timeoutMs?

> `readonly` `optional` **timeoutMs?**: `number`

Defined in: [business/routing/jev.ts:54](https://github.com/juli-os/routing/blob/main/src/business/routing/jev.ts#L54)

***

### token

> `readonly` **token**: `string`

Defined in: [business/routing/jev.ts:50](https://github.com/juli-os/routing/blob/main/src/business/routing/jev.ts#L50)
