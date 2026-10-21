import test from 'node:test';
import assert from 'node:assert/strict';
import {executionSucceeded} from '../src/utils/executionResult.js';
test('sample grading rejects failed execution even when stdout matches an empty expected result', () => {
  for (const result of [{}, {run:{stdout:'',code:1}}, {run:{stdout:'',code:0,signal:'SIGTERM'}}, {run:{stdout:'',stderr:'Runtime error',code:0}}, {compile:{code:1,stderr:'Syntax error'},run:{stdout:'',code:0}}]) assert.equal(executionSucceeded(result), false);
  assert.equal(executionSucceeded({run:{stdout:'',stderr:'',code:0}}), true);
  assert.equal(executionSucceeded({compile:{code:0},run:{stdout:'3',code:0}}), true);
});
