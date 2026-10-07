import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPreset } from '../domain/preset';
import { parseRecovery } from '../domain/recovery';

test('recovery accepts existing v2 files and rejects malformed inputs before writing', () => {
  const before: number[] = Array(1024).fill(255);
  before.splice(720, 7, 165, 1, 4, 11, 13, 115, 1);
  const bundle = { version: 2, preset: createPreset(), before };
  assert.deepEqual(parseRecovery(bundle).preset, bundle.preset);
  assert.equal(parseRecovery(bundle).includeExternals, false);
  assert.equal(parseRecovery({ ...bundle, includeExternals: true }).includeExternals, true);
  for (const invalid of [
    null,
    {},
    { ...bundle, version: 1 },
    { ...bundle, before: [] },
    { ...bundle, preset: {} },
  ]) {
    assert.throws(() => parseRecovery(invalid));
  }
});
