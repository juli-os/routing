// Facade 表面快照：显式名单断言（非盲快照）——增删导出必须显式改这份名单。
// 教训：漏导出此前靠主仓 typecheck 才发现（agents d02a891/47c72e7、ledger
// c98550d/a7b44f4/ae62e5f 共 4+ 次）；本测试把围栏前移到本仓 CI 红。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as facade from '../src/index.ts';

test('facade value-export surface matches the explicit snapshot list', () => {
  const expected = [
    'JUDGMENT_SCENARIOS', 'SAMPLE_FACTS', 'SAMPLE_RECORDS',
    'createCliJudge', 'createJev', 'createJudgeFromConfig', 'createJudgmentGateway',
    'createLocalApiJudge', 'decideRoute', 'dupCandidates', 'feedbackSessionFor',
    'isInternalSender', 'jevTokenFromEnv', 'loadJudgmentConfig', 'parseJudgmentConfig',
    'planRouting', 'routeTask', 'routeTaskMenu', 'ticketTitle', 'topAlternatives',
  ];
  assert.deepEqual(Object.keys(facade).sort(), [...expected].sort());
});
