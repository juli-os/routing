[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / BoundAgent

# Interface: BoundAgent

Defined in: [business/routing/decision.ts:8](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L8)

绑定会话（专用 agent 隔离）：session 名 + 自建 cwd + 白名单发件人。
只有白名单发件人的邮件能把单子路由进绑定会话；其余通道（web/CLI/agent
步钉）一律被 runAgentStep 的 session_bound 守卫拒派。

## Properties

### cwd

> `readonly` **cwd**: `string`

Defined in: [business/routing/decision.ts:10](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L10)

***

### senders

> `readonly` **senders**: readonly `string`[]

Defined in: [business/routing/decision.ts:11](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L11)

***

### session

> `readonly` **session**: `string`

Defined in: [business/routing/decision.ts:9](https://github.com/juli-os/routing/blob/main/src/business/routing/decision.ts#L9)
