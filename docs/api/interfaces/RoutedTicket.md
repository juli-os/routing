[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / RoutedTicket

# Interface: RoutedTicket

Defined in: [business/routing/plan.ts:35](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L35)

## Properties

### baseline

> `readonly` **baseline**: `object`

Defined in: [business/routing/plan.ts:45](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L45)

现行引擎链会怎么走（前缀规则命中 or 渠道默认兜底）。

#### session

> `readonly` **session**: `string`

#### source

> `readonly` **source**: `"default"` \| `"rule"`

***

### confidence

> `readonly` **confidence**: `number`

Defined in: [business/routing/plan.ts:40](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L40)

***

### dupWith?

> `readonly` `optional` **dupWith?**: readonly `object`[]

Defined in: [business/routing/plan.ts:47](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L47)

疑似同根因的伙伴单（合并判定得分≥阈值的对端）。

***

### pass

> `readonly` **pass**: `number`

Defined in: [business/routing/plan.ts:43](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L43)

第几轮定下来；0 = 基线-only。

***

### probabilities

> `readonly` **probabilities**: `Readonly`\<`Record`\<`string`, `number`\>\>

Defined in: [business/routing/plan.ts:41](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L41)

***

### record

> `readonly` **record**: [`FbRecord`](FbRecord.md)

Defined in: [business/routing/plan.ts:36](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L36)

***

### session

> `readonly` **session**: `string`

Defined in: [business/routing/plan.ts:38](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L38)

目标会话；'' = 未定（needsHuman）。

***

### via

> `readonly` **via**: `"default"` \| `"jev"` \| `"rule"` \| `"uncertain"`

Defined in: [business/routing/plan.ts:39](https://github.com/juli-os/routing/blob/main/src/business/routing/plan.ts#L39)
