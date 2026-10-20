# PROBLEMS.pkgreview-20261020 — @juli-os/routing 逐文件 review & fix 台账

- 日期：2026-10-20；范围：本仓全部 15 个 TS 文件（/tmp/pkgreview-routing.txt），每文件一子 agent 保守修
- 纪律：只修 100% 不改行为项（已发包铁律：公开行为/导出签名/wire 格式/存储布局一律只报告）；test 断言/fixture 不动；零 git 写操作
- 基线快照 /tmp/pkgreview-baseline/routing/；批次报告 /tmp/pkgreview-reports/batch-0*.json
- 验证终态：npm run build + npm test 全绿（见总控汇总）

## 逐文件明细

### bin/juli-routing.ts

fixed=2 reported_only=1

- **P1** L12 [fixed] sampleRouting() 虚构中间接口（defaultProject 字段数据里不存在/senders 可选性错/boundAgents 形状凭空），换真实 Routing 类型的单一受控转换（stdout 逐字节一致）
- **P1** L21 [fixed] 三处 as never 最不诚实强转（存在仅因虚构类型不满足 Routing），随上项消除
- **P2** L25 [reported-only] 未知子命令静默跑 demo 而非报用法（inspection CLI 可辩护设计）

### src/business/intake/feedbackIntake.ts

零发现。

### src/business/intake/feedbackMirror.ts

零发现。

### src/business/routing/decision.ts

fixed=2 reported_only=3

- **P1** L115 [reported-only] RouteDecision.fallback 恒为 false（两分支硬编码，消费仓零读取；真落回审计在 route_fallback 事件）——账本里永远写一个无信息量字段
- **P2** L94 [reported-only] 声明侧 trim 不对称：域匹配腿不 trim 声明条目（绑定腿/isInternalSender 都 trim）——带空白垫的声明会 miss（修=改公开匹配行为）
- **P2** L18 [fixed] 翻译残留残句注释（中文半句+英文整句+中文句号），改真
- **P2** L68 [fixed] || '' 与 ?? '' 同函数混用（string|undefined 取值域等价），统一
- **P2** L91 [reported-only] 绑定集合+过滤非绑定声明习语三处手写（decision/routeTask/消费仓 intake）

### src/business/routing/jev.ts

fixed=0 reported_only=2

- **P2** L65 [reported-only] createJev.ask 与 judgment.ts createLocalApiJudge.ask 骨架 copy-paste（跨文件）
- **P2** L82 [reported-only] 响应校验过浅类型说谎：不排数组+usage/model 直接透传——服务端畸形响应时 undefined 进账本（修=改公开可观察行为）

### src/business/routing/judgment.ts

fixed=8 reported_only=1

- **P2** L10 [fixed] 死 import type JudgmentOutcome，删
- **P1** L29 [fixed] min_confidence 0.7 写 3 处字面量（threshold()×2+ask base）须手抄同步——漂移会击穿 TOCTOU 收口承诺，提常量
- **P2** L102 [fixed] 'jev-local' 默认值抄 3 遍，提 const
- **P2** L139 [fixed] cli: 模型标签 2 处重复，提 const
- **P2** L144 [fixed] timeoutMs ?? 30_000 在时长与错误消息各算一遍（须一致否则谎报），提 const
- **P2** L196 [fixed] cfg.cloud!.token! 双重非空断言，改 ?? '' 收窄（null 降级语义逐输入等价）
- **P2** L35 [fixed] 手写 null/typeof 检查+as，改 3 行之上现成的 isPlainObject 守卫
- **P2** L48 [fixed] isPlainObject 守卫后仍 as 断言（TS4.7+ 可窄化），删
- **P2** L146 [reported-only] spawn(opts.cmd[0]!) 非空断言（guard 在 createJudgeFromConfig，直接调用侧可达——修=改错误路径行为）

### src/business/routing/plan.ts

fixed=2 reported_only=5

- **P1** L172 [fixed] planRouting 内局部 routing 变量从未读取（tsconfig 未开 noUnusedLocals 静默），删
- **P2** L240 [fixed] 复合守卫相邻两 if 逐字重复，嵌套去重
- **P2** L264 [reported-only] 同守卫在相邻三元再重复一遍（收益边际）
- **P2** L138 [reported-only] bits.length>0 恒真子条件（防御式）
- **P2** L292 [reported-only] 模型违规返回 choice='' 时单据从两个输出面消失但 stats.tickets 仍计数（推断边界缺口）
- **P2** L184 [reported-only] opts.judge! 断言×2（noJudge 可证安全，收紧需重构）
- **P2** L239 [reported-only] [...pending] 防御性拷贝（循环体未突变）

### src/business/routing/routeTask.ts

fixed=1 reported_only=2

- **P2** L70 [fixed] 三处 outcome.answer! 非空断言（menuHit 合取可证安全），改窄化局部变量
- **P2** L85 [reported-only] 活性守卫表达式两处不同主语重复（单行子表达式）
- **P2** L81 [reported-only] ideal!=='' 守卫仅退化配置可达（近乎无效但类型可达非死代码）

### src/contracts/ports.ts

fixed=0 reported_only=1

- **P2** L38 [reported-only] JudgmentQuestion 与 jev.ts JevQuestion 跨文件复制（依赖方向刻意镜像）

### src/index.ts

fixed=0 reported_only=1

- **P2** L36 [reported-only] JudgmentQuestion 出现在 ask 签名里但 facade 未 re-export（下游无法按名引用；词汇缺口非缺陷）

### src/platform/shared/json.ts

fixed=0 reported_only=4

- **P1** L1 [reported-only] 整文件本仓死代码（家族同形+已发布 .d.ts 面禁删）
- **P2** L1 [reported-only] npm 包发布孤儿 .d.ts（无对应 .js，exports 不可达，tarball 死重）
- **P2** L1 [reported-only] json 家族：l0/l2/routing 逐字节同、ledger 裁剪版——生态事实源已收编 artifacts
- **P2** L29 [reported-only] truncate n=0 返回 '…'（同款边界）

### src/platform/shared/result.ts

fixed=0 reported_only=2

- **P2** L1 [reported-only] 整文件本仓死代码+头注释宣称与实际不符（家族同形禁删）
- **P2** L13 [reported-only] 家族副本行为漂移：agents '操作失败' vs 本仓/artifacts 'operation failed'

### test/judgment-config.test.ts

零发现。

### test/smoke.test.ts

fixed=0 reported_only=3

- **P2** L20 [reported-only] decideRoute 实参 as never 断言禁用全部类型检查（字面量本可结构满足 Routing；fixture 禁动）
- **P2** L60 [reported-only] FbRecord 实参 as never 伪造部分记录（as FbRecord 更诚实；fixture 禁动）
- **P2** L27 [reported-only] test1/test2 routing fixture 骨架雷同仅值不同（per-test 隔离惯例）

### test/surface.test.ts

零发现。
