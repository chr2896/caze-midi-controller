import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPreset } from '../domain/preset';
import { decodeSnapshot } from '../domain/serial-protocol';
import { buildImage, crc16, storageState } from '../domain/storage-layout';
import { SerialClient } from '../services/serial-client';

function legacy() {
  const bytes = new Array(1024).fill(255);
  bytes.splice(720, 7, 165, 1, 4, 11, 13, 115, 1);
  return bytes;
}
function snapshot(image: Uint8Array) {
  const bytes = new Array(1024).fill(0);
  bytes.splice(0, image.length, ...image);
  bytes.splice(1020, 4, 67, 90, 3, 165);
  return bytes;
}
test('CRC16 matches CCITT-FALSE reference', () => {
  assert.equal(crc16(new TextEncoder().encode('123456789')), 0x29b1);
});
test('preset writes leave the independent pedal calibration untouched', () => {
  const before = legacy();
  const calibration = [150, 0, 180, 3, 17, 29, 199];
  before.splice(936, 7, ...calibration);
  const image = buildImage(createPreset(), before);
  const after = [...before];
  after.splice(0, image.length, ...image);
  assert.deepEqual(after.slice(936, 943), calibration);
});
test('all 36 actions, 12-character labels and flag bits round-trip without overlap', () => {
  const preset = createPreset();
  let index = 0;
  for (const page of preset.pages)
    for (const foot of page)
      for (const action of foot) {
        Object.assign(action, {
          type: 3,
          channel: (index % 16) + 1,
          value1: index,
          value2: index + 10,
          value3: index + 60,
          label: String(index).padStart(12, 'X'),
          toggleOnOff: index % 2 === 0,
        });
        index++;
      }
  const image = buildImage(preset, legacy());
  const decoded = decodeSnapshot(snapshot(image), createPreset());
  assert.equal(image.length, 936);
  assert.equal(decoded.loaded, 45);
  assert.deepEqual(decoded.preset, preset);
  assert.deepEqual(decoded.warnings, []);
  assert.deepEqual([...image.slice(928, 935)], legacy().slice(720, 727));
  assert.equal(image[935], 1);
  assert.equal(image[924] & 192, 0);
});
test('subsequent saves preserve relocated expression data instead of reading label bytes', () => {
  const first = snapshot(buildImage(createPreset(), legacy()));
  first.splice(928, 7, 165, 0, 16, 74, 20, 110, 0);
  const second = buildImage(createPreset(), first);
  assert.deepEqual([...second.slice(928, 935)], first.slice(928, 935));
});
test('incomplete EEPROM is never interpreted as a complete preset', () => {
  const bytes = snapshot(buildImage(createPreset(), legacy()));
  bytes[1023] = 81;
  assert.equal(storageState(bytes), 'pending');
  assert.equal(decodeSnapshot(bytes, createPreset()).loaded, 0);
  assert.throws(() => buildImage(createPreset(), bytes), /Recuperar/);
});
test('invalid source expression and oversized labels abort before sending', () => {
  const bytes = legacy();
  bytes[722] = 0;
  assert.throws(() => buildImage(createPreset(), bytes), /expressão/);
  const preset = createPreset();
  preset.pages[0][0][0].label = 'longer than twelve';
  assert.throws(() => buildImage(preset, legacy()));
});
test('writer sends ordered blocks, commits only after all bytes and verifies readback', async () => {
  const image = buildImage(createPreset(), legacy());
  const received: number[] = [],
    commands: number[] = [];
  const client = new SerialClient();
  client.canWrite = true;
  client.canUnified = true;
  client.canPackedText = true;
  client.request = async (command, payload = []) => {
    commands.push(command);
    if (command === 3) assert.equal((payload[0] << 8) | payload[1], crc16(image));
    if (command === 4) {
      assert.equal((payload[0] << 8) | payload[1], received.length);
      assert.ok(payload.length <= 18);
      received.push(...payload.slice(2));
    }
    if (command === 5) assert.deepEqual(received, [...image]);
    return command === 2 ? snapshot(image) : [0];
  };
  const progress: number[] = [];
  assert.deepEqual(await client.saveImage(image, (value) => progress.push(value)), snapshot(image));
  assert.equal(commands.filter((c) => c === 4).length, 59);
  assert.deepEqual(commands.slice(-2), [5, 2]);
  assert.equal(progress.at(-1), 100);
});
test('writer stops on a failed block and rejects mismatched readback', async () => {
  const image = buildImage(createPreset(), legacy());
  const client = new SerialClient();
  client.canWrite = true;
  client.canUnified = true;
  client.canPackedText = true;
  const commands: number[] = [];
  client.request = async (command) => {
    commands.push(command);
    return command === 4 ? [1] : [0];
  };
  await assert.rejects(client.saveImage(image), /recusou/);
  assert.deepEqual(commands, [3, 4]);
  client.request = async (command) => {
    if (command !== 2) return [0];
    const bytes = snapshot(image);
    bytes[0] ^= 1;
    return bytes;
  };
  await assert.rejects(client.saveImage(image), /releitura/);
});
test('writer refuses old firmware and menu-active responses before blocks', async () => {
  const image = buildImage(createPreset(), legacy());
  const client = new SerialClient();
  await assert.rejects(client.saveImage(image), /Atualize/);
  client.canWrite = true;
  client.canUnified = true;
  client.canPackedText = true;
  const commands: number[] = [];
  client.request = async (command) => {
    commands.push(command);
    return [2];
  };
  await assert.rejects(client.saveImage(image), /menus/);
  assert.deepEqual(commands, [3]);
});
