import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPreset, presetSignature } from '../domain/preset';

test('USB comparison ignores field order and absent empty state text', () => {
  const draft = createPreset();
  const read = structuredClone(draft);
  read.pages[0][0][0] = Object.fromEntries(
    Object.entries(read.pages[0][0][0]).reverse(),
  ) as (typeof read.pages)[0][0][0];
  read.pages[0][0][0].state1 = '';
  read.pages[0][0][0].state2 = '';
  assert.equal(presetSignature(draft), presetSignature(read));
  read.pages[0][0][0].label = 'CHANGED';
  assert.notEqual(presetSignature(draft), presetSignature(read));
  read.pages[0][0][0].label = '';
  assert.equal(presetSignature(draft), presetSignature(read));
  assert.ok(read.externals);
  read.externals[0].value1 = 64;
  assert.notEqual(presetSignature(draft), presetSignature(read));
});
