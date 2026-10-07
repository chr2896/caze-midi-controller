import assert from 'node:assert/strict';
import { test } from 'node:test';
import { displayPreview } from '../domain/display-preview';
import { internalTextUsage, orderedActions } from '../domain/internal-text';
import { commandText, createPreset, isTapTempo, validatePreset } from '../domain/preset';
import { quadCommands, quadPatch } from '../domain/quad-library';
import { decodeSnapshot } from '../domain/serial-protocol';
import { buildImage, imageAddress } from '../domain/storage-layout';
import { SerialClient } from '../services/serial-client';

function findCommand(cc: number) {
  const command = quadCommands.find((c) => c.cc === cc);
  assert.ok(command);
  return command;
}
const before = () => {
  const bytes: number[] = Array(1024).fill(255);
  bytes.splice(720, 7, 165, 1, 1, 11, 0, 127, 0);
  return bytes;
};
const snapshot = (image: Uint8Array) => {
  const bytes = before();
  image.forEach((v, i) => {
    bytes[imageAddress(i)] = v;
  });
  bytes.splice(1020, 4, 67, 90, 2, 165);
  return bytes;
};
test('54 packed actions round-trip labels, states, channels, flags and tap policies without touching calibration', () => {
  const preset = createPreset();
  orderedActions(preset).forEach((a, i) => {
    Object.assign(a, {
      type: 3,
      channel: (i % 16) + 1,
      label: `F${i}`,
      state1: `A${i}`,
      state2: `B${i}`,
      tapTempo: i % 2 === 0,
      toggleOnOff: i % 3 === 0,
    });
  });
  const image = buildImage(preset, before(), true);
  const bytes = snapshot(image);
  assert.deepEqual(bytes.slice(936, 943), before().slice(936, 943));
  const decoded = decodeSnapshot(bytes, createPreset());
  assert.deepEqual(decoded.warnings, []);
  assert.equal(decoded.loaded, 54);
  assert.deepEqual(decoded.preset, preset);
});
test('540 character packed boundary succeeds, 541 and invalid state text fail', () => {
  const preset = createPreset();
  for (const a of orderedActions(preset)) {
    a.label = '123456789';
    a.state1 = 'A';
  }
  assert.equal(internalTextUsage(preset), 540);
  assert.doesNotThrow(() => buildImage(preset, before()));
  preset.pages[0][0][0].state2 = 'B';
  assert.throws(() => validatePreset(preset), /540/);
  preset.pages[0][0][0].state2 = 'é';
  assert.throws(() => validatePreset(preset), /inválidos/);
});
test('invalid packed lengths and ASCII never replace the local draft', () => {
  const preset = createPreset();
  preset.pages[0][0][0].state1 = 'ON';
  const image = buildImage(preset, before());
  for (const [address, value] of [
    [270, 255],
    [271, 48],
    [378, 255],
  ]) {
    const bytes = snapshot(image);
    bytes[address] = value;
    const decoded = decodeSnapshot(bytes, preset);
    assert.equal(decoded.loaded, 0);
    assert.deepEqual(decoded.preset, preset);
    assert.match(decoded.warnings[0], /corrompidos/);
  }
});
test('old-format reading clears stale custom states and explicit tap metadata', () => {
  const preset = createPreset();
  const draft = createPreset();
  Object.assign(draft.pages[0][0][0], { state1: 'A', state2: 'B', tapTempo: true });
  assert.deepEqual(decodeSnapshot(snapshot(buildImage(preset, before())), draft).preset, preset);
});
test('packed writer refuses old firmware before BEGIN and negotiates format 3 with supported firmware', async () => {
  const preset = createPreset();
  preset.pages[0][0][0].state1 = 'A';
  const image = buildImage(preset, before(), true);
  const client = new SerialClient();
  client.canWrite = true;
  client.canExternal = true;
  let calls = 0;
  client.request = async (command) => {
    calls++;
    return command === 2 ? snapshot(image) : [0];
  };
  await assert.rejects(client.saveImage(image), /Atualize/);
  assert.equal(calls, 0);
  client.canPackedText = true;
  client.request = async (command, payload = []) => {
    if (command === 3) assert.deepEqual(payload.slice(2), [3, 245, 3]);
    return command === 2 ? snapshot(image) : [0];
  };
  await client.saveImage(image);
});
test('official table coverage, trigger semantics and every selectable label fit storage constraints', () => {
  assert.equal(quadCommands.length, 34);
  assert.equal(new Set(quadCommands.map((c) => c.id)).size, 34);
  assert.deepEqual(
    quadCommands.flatMap((c) => (c.cc === undefined ? [] : [c.cc])).sort((a, b) => a - b),
    [0, 1, 2, 32, ...Array.from({ length: 28 }, (_, i) => 35 + i), 64],
  );
  for (const c of quadCommands) {
    for (const o of c.options ?? [{ value: 127 }]) {
      const preset = createPreset();
      Object.assign(preset.pages[0][0][0], quadPatch(c, o.value, c.options?.[0].value));
      assert.doesNotThrow(() => validatePreset(preset));
    }
  }
  for (let n = 49; n <= 56; n++) {
    const patch = quadPatch(findCommand(n), 0);
    assert.equal(patch.type, 2);
    assert.equal(patch.value2, 127);
  }
});
test('Quad CC42 is not Nano tap; CC44 tap works internally and externally; state labels preserve MIDI values', () => {
  const a = createPreset().pages[0][0][0];
  Object.assign(a, { type: 2, value1: 42 });
  assert.equal(isTapTempo(a), true);
  Object.assign(a, quadPatch(findCommand(42), 0));
  assert.equal(isTapTempo(a), false);
  Object.assign(a, quadPatch(findCommand(44), 0));
  assert.equal(isTapTempo(a), true);
  assert.match(displayPreview(a, 6, 0, 0, 127, 2).line2, /-- BPM/);
  const p = createPreset();
  assert.ok(p.externals);
  Object.assign(p.externals[0], a);
  const decoded = decodeSnapshot(snapshot(buildImage(p, before(), true)), createPreset());
  assert.equal(decoded.preset.externals?.[0].tapTempo, true);
  Object.assign(a, quadPatch(findCommand(47), 0, 2));
  assert.equal(commandText(a, 0), '(PRESET)');
  assert.equal(commandText(a, 2), '(STOMP)');
  assert.equal(a.value3, 2);
});
