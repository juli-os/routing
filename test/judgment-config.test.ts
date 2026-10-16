// parseJudgmentConfig 子对象形状校验（judgment.json 是人工热读面）：此前
// cloud/local_api/cli 三个子对象直接 as 信任——`cli: { cmd: "echo hi" }`（字符串
// 非数组）能穿过 createJudgeFromConfig 的 `cmd.length === 0` 检查（字符串也有
// length），随后 cmd.slice(1) 按字符拆参 spawn。三态：坏形状=关（null）、缺字段
// =保留降级语义（提供方不可用→全场景 off）、良形=照常解析。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJudgmentConfig } from '../src/index.ts';

test('parseJudgmentConfig: cli.cmd as a string is rejected (string has .length — spawn would char-split it)', () => {
  assert.equal(parseJudgmentConfig({ provider: 'cli', cli: { cmd: 'echo hi' } }), null);
});

test('parseJudgmentConfig: bad sub-object shapes are rejected (scalar / array / non-string cmd elements)', () => {
  assert.equal(parseJudgmentConfig({ provider: 'cloud', cloud: 'oops' }), null);
  assert.equal(parseJudgmentConfig({ provider: 'local-api', local_api: ['http://x'] }), null);
  assert.equal(parseJudgmentConfig({ provider: 'cli', cli: 'echo' }), null);
  assert.equal(parseJudgmentConfig({ provider: 'cli', cli: { cmd: ['node', 42] } }), null);
});

test('parseJudgmentConfig: missing sub-object fields still parse (degradation happens at judge construction, not parse)', () => {
  const cfg = parseJudgmentConfig({ provider: 'cli' });
  assert.ok(cfg !== null);
  assert.equal(cfg.provider, 'cli');
  assert.equal(cfg.cli, undefined);
  const cfgCmdless = parseJudgmentConfig({ provider: 'cli', cli: {} });
  assert.ok(cfgCmdless !== null);
  assert.deepEqual(cfgCmdless.cli, {});
});

test('parseJudgmentConfig: well-formed cli config parses with cmd intact', () => {
  const cfg = parseJudgmentConfig({ provider: 'cli', cli: { cmd: ['node', 'judge.js'] } });
  assert.ok(cfg !== null);
  assert.deepEqual(cfg.cli?.cmd, ['node', 'judge.js']);
});
