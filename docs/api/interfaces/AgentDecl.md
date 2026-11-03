[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / AgentDecl

# Interface: AgentDecl

Defined in: [business/routing/decision.ts:29](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L29)

agents.yaml 声明段里的一条（config.agents）。

## Properties

### company

> `readonly` **company**: `string`

Defined in: [business/routing/decision.ts:31](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L31)

***

### cwd?

> `readonly` `optional` **cwd?**: `string`

Defined in: [business/routing/decision.ts:35](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L35)

***

### description?

> `readonly` `optional` **description?**: `string`

Defined in: [business/routing/decision.ts:38](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L38)

一句话业务描述（config.agents 声明；jev 路由菜单/钉住清单的判定与
显示质量杠杆——company/domain 两词太瘦）。

***

### domain

> `readonly` **domain**: `string`

Defined in: [business/routing/decision.ts:32](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L32)

***

### model\_tier?

> `readonly` `optional` **model\_tier?**: `"standard"` \| `"high"`

Defined in: [business/routing/decision.ts:42](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L42)

模型档位（2026-09-28 用户裁定「非必要不高智能」）：standard=默认全档，
high=冷启动引导时带 --model 高档 id；input.model_tier='high' 的任务在
路由时改道 high 声明会话（同 cwd 孪生优先）。缺省 standard。

***

### senders?

> `readonly` `optional` **senders?**: readonly `string`[]

Defined in: [business/routing/decision.ts:34](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L34)

发件域声明（公司匹配的输入之一；绑定语义仍在 bound_agents）。

***

### session

> `readonly` **session**: `string`

Defined in: [business/routing/decision.ts:30](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L30)
