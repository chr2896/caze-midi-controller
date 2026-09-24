import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPreset, validatePreset, commandText, isTapTempo } from './preset.js';
test('preset round trip preserves all 54 actions independently', () => {
  const preset = createPreset(); preset.pages[2][5][2].label = 'SOLO';
  assert.equal(validatePreset(JSON.parse(JSON.stringify(preset))).pages[2][5][2].label, 'SOLO');
  assert.equal(preset.pages[0][0][0].label, '');
});
test('reject invalid MIDI, pages and labels on import', () => {
  for (const patch of [{ channel: 0 }, { value1: 128 }, { label: 'á' }, { label: '1234567890123' }, { type: 6, value1: 3 }]) {
    const preset = createPreset(); Object.assign(preset.pages[0][0][0], patch);
    assert.throws(() => validatePreset(preset));
  }
  assert.throws(() => validatePreset({ version: 1, pages: [] }));
});
test('toggle preview preserves active parentheses and custom values', () => {
  assert.equal(commandText({ type: 3, value2: 0, value3: 127 }, 0), '(OFF) ON');
  assert.equal(commandText({ type: 3, value2: 24, value3: 96 }, 96), '24 (96)');
});
test('CC42 previews BPM without changing MIDI values or treating PG42 as tap', () => {
  const action = { type: 2, value1: 42, value2: 127 };
  assert.equal(isTapTempo(action), true);
  assert.equal(commandText(action, 127), '-- BPM');
  assert.equal(commandText({ ...action, type: 3, value3: 0 }, 0), '-- BPM');
  assert.equal(isTapTempo({ ...action, type: 1 }), false);
  assert.equal(commandText({ ...action, type: 1 }, 127), 'PG 42 127');
  assert.deepEqual(action, { type: 2, value1: 42, value2: 127 });
});
test('optional ON/OFF labels preserve MIDI values and work in either order', () => {
  const action = { type: 3, value2: 24, value3: 96, toggleOnOff: true };
  assert.equal(commandText(action, 96), 'OFF (ON)');
  assert.equal(commandText({ ...action, value2: 96, value3: 24 }, 24), 'ON (OFF)');
  assert.equal(commandText({ ...action, toggleOnOff: false }, 24), '(24) 96');
  assert.equal(commandText({ ...action, value3: 24 }, 24), '(24) (24)');
  assert.equal(action.value2, 24);
  assert.equal(action.value3, 96);
});
test('ON/OFF option survives export and accepts older presets', () => {
  const preset = createPreset();
  preset.pages[0][0][0].toggleOnOff = true;
  assert.equal(validatePreset(JSON.parse(JSON.stringify(preset))).pages[0][0][0].toggleOnOff, true);
  delete preset.pages[0][0][0].toggleOnOff;
  assert.doesNotThrow(() => validatePreset(preset));
  preset.pages[0][0][0].toggleOnOff = 'true';
  assert.throws(() => validatePreset(preset));
});
