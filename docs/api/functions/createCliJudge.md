[**@juli-os/routing**](../index.md)

***

[@juli-os/routing](../index.md) / createCliJudge

# Function: createCliJudge()

> **createCliJudge**(`opts`): [`Judge`](../interfaces/Judge.md)

Defined in: [business/routing/judgment.ts:135](https://github.com/juli-os/routing/blob/main/src/business/routing/judgment.ts#L135)

cli：子进程判定——JSON {state,questions} 走 stdin，{answers} 走 stdout。
本地 CLI 部署（离线模型/脚本包装）零改码接入。

## Parameters

### opts

#### cmd

readonly `string`[]

#### spawnImpl?

\{(`command`, `options?`): `ChildProcessWithoutNullStreams`; (`command`, `options`): `ChildProcessByStdio`\<`Writable`, `Readable`, `Readable`\>; (`command`, `options`): `ChildProcessByStdio`\<`Writable`, `Readable`, `null`\>; (`command`, `options`): `ChildProcessByStdio`\<`Writable`, `null`, `Readable`\>; (`command`, `options`): `ChildProcessByStdio`\<`null`, `Readable`, `Readable`\>; (`command`, `options`): `ChildProcessByStdio`\<`Writable`, `null`, `null`\>; (`command`, `options`): `ChildProcessByStdio`\<`null`, `Readable`, `null`\>; (`command`, `options`): `ChildProcessByStdio`\<`null`, `null`, `Readable`\>; (`command`, `options`): `ChildProcessByStdio`\<`null`, `null`, `null`\>; (`command`, `options`): `ChildProcess`; (`command`, `args?`, `options?`): `ChildProcessWithoutNullStreams`; (`command`, `args`, `options`): `ChildProcessByStdio`\<`Writable`, `Readable`, `Readable`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`Writable`, `Readable`, `null`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`Writable`, `null`, `Readable`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`null`, `Readable`, `Readable`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`Writable`, `null`, `null`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`null`, `Readable`, `null`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`null`, `null`, `Readable`\>; (`command`, `args`, `options`): `ChildProcessByStdio`\<`null`, `null`, `null`\>; (`command`, `args`, `options`): `ChildProcess`; \}

#### timeoutMs?

`number`

## Returns

[`Judge`](../interfaces/Judge.md)
