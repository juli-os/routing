[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / dupCandidates

# Function: dupCandidates()

> **dupCandidates**(`records`, `cap`): readonly (readonly \[[`FbRecord`](../interfaces/FbRecord.md), [`FbRecord`](../interfaces/FbRecord.md)\])[]

Defined in: [business/routing/plan.ts:110](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L110)

合并候选对预筛（代码拥有候选集，O(n²) 不进 API）：同页/同人/同线程链。

## Parameters

### records

readonly [`FbRecord`](../interfaces/FbRecord.md)[]

### cap

`number`

## Returns

readonly (readonly \[[`FbRecord`](../interfaces/FbRecord.md), [`FbRecord`](../interfaces/FbRecord.md)\])[]
