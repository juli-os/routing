[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / JUDGMENT\_SCENARIOS

# Variable: JUDGMENT\_SCENARIOS

> `const` **JUDGMENT\_SCENARIOS**: readonly \[`"route_intake"`, `"route_fallback"`, `"intake_gate"`, `"align_needed"`, `"aggregate_same"`, `"handoff_domain"`, `"output_quality"`, `"redline_semantic"`, `"triage_classify"`, `"mount_infer"`, `"task_tier"`, `"alert_grade"`\]

Defined in: [contracts/ports.ts:26](https://github.com/juli-os/routing/blob/main/src/contracts/ports.ts#L26)

场景全集的运行时镜像（judgment.json 是人工热读面——拼错的场景键必须能被
识别丢弃，否则「以为在影子期攒数据、实际该场景从未出网」零反馈）。围栏
双向：satisfies 防名单多出未知成员，Exhaustive 断言防联合新增成员漏进
名单（单向注解只防多不防漏，71af31d 加 task_tier 时曾靠手工同步）。
