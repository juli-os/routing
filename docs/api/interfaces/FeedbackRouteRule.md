[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / FeedbackRouteRule

# Interface: FeedbackRouteRule

Defined in: [business/intake/feedbackIntake.ts:5](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackIntake.ts#L5)

## Properties

### prefix

> `readonly` **prefix**: `string`

Defined in: [business/intake/feedbackIntake.ts:7](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackIntake.ts#L7)

匹配 FbRecord.page 的前缀（页面路径，如 "/site"）。空串不参与匹配。

***

### session

> `readonly` **session**: `string`

Defined in: [business/intake/feedbackIntake.ts:9](https://github.com/juli-os/routing/blob/main/src/business/intake/feedbackIntake.ts#L9)

命中 → 播种到该会话（步骤级 session 钉死，不再落 defaultSession）。
