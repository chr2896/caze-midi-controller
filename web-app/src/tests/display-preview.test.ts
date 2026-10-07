import assert from 'node:assert/strict';
import { test } from 'node:test';
import { displayPreview } from '../domain/display-preview';
import { createPreset } from '../domain/preset';

test('LCD preserves 16 columns, the selected gesture and MIDI percentage endpoints', () => {
  const action = createPreset().pages[0][0][0];
  for (const [midi, suffix] of [
    [0, '  0%'],
    [127, '100%'],
  ] as const) {
    const { line1, line2 } = displayPreview(action, 1, 2, 1, midi, 2);
    assert.equal(line1, 'LNG FS 2 P3  EXP');
    assert.equal(line1.length, 16);
    assert.equal(line2.length, 16);
    assert.equal(line2.slice(12), suffix);
  }
});
test('external mode states and internal tap retain distinct LCD behavior', () => {
  const action = {
    ...createPreset().pages[0][0][0],
    type: 3,
    value1: 47,
    value2: 0,
    value3: 2,
    label: 'MODO',
    state1: 'PRESET',
    state2: 'STOMP',
  };
  assert.equal(displayPreview(action, 6, 0, 0, 64, 2).line2.trim(), '(PRESET)     50%');
  assert.equal(displayPreview(action, 6, 0, 0, 64, 3).line2.trim(), '(STOMP)      50%');
  const tap = { ...action, label: '', type: 2, value1: 42 };
  assert.equal(displayPreview(tap, 0, 0, 0, 0, 2).line1, 'TAP TEMPO    EXP');
  assert.equal(displayPreview(tap, 6, 0, 0, 0, 2).line2.trim(), 'CC 42 0       0%');
});
