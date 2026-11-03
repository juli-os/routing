[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / JudgmentGateway

# Interface: JudgmentGateway

Defined in: [contracts/ports.ts:45](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L45)

判定网关（消费方只认这个）：模式裁断在网关（off 直接 null，不产生网络）；
shadow=照常判定留痕但结果不生效；on=结果可被消费方采用（消费方仍须按
引擎侧规则校验答案——「typed judgment 只做输入，决定留引擎」）。

## Methods

### ask()

> **ask**(`scenario`, `state`, `questions`): `Promise`\<[`JudgmentOutcome`](JudgmentOutcome.md) \| `null`\>

Defined in: [contracts/ports.ts:52](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L52)

执行判定。off → null（调用方零成本跳过）；网关不抛——网络/配置失败
降级为 error 结果，消费方按默认行为走（jev 挂了不许挂管线）。

#### Parameters

##### scenario

[`JudgmentScenario`](../type-aliases/JudgmentScenario.md)

##### state

`unknown`

##### questions

`Readonly`\<`Record`\<`string`, `JudgmentQuestion`\>\>

#### Returns

`Promise`\<[`JudgmentOutcome`](JudgmentOutcome.md) \| `null`\>

***

### threshold()

> **threshold**(): `number`

Defined in: [contracts/ports.ts:49](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L49)

采纳阈值（config.min_confidence，**全局单值**默认 0.7）：on 模式下置信度
低于它的答案消费方必须拒绝（降级默认行为）。无场景参数——场景级的是
off/shadow/on，阈值不是，勿误读为可按场景配置。

#### Returns

`number`
