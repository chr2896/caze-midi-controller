import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createExternals,
  decodeExternals,
  encodeExternals,
  externalCommandText,
  validateExternals,
} from '../domain/external-config';
import { createPreset, validatePreset } from '../domain/preset';
import { decodeSnapshot } from '../domain/serial-protocol';
import { buildImage, crc16, EXTENDED_IMAGE_SIZE, imageAddress } from '../domain/storage-layout';
import { SerialClient } from '../services/serial-client';

function preset() {
  const p = createPreset();
  assert.ok(p.externals);
  Object.assign(p.externals[0], {
    type: 3,
    channel: 16,
    value1: 47,
    value2: 0,
    value3: 2,
    label: 'MODO',
    state1: 'PRESET',
    state2: 'STOMP',
  });
  Object.assign(p.externals[1], {
    type: 3,
    value1: 64,
    label: 'PAGINA QUAD',
    state1: 'I',
    state2: 'II',
  });
  Object.assign(p.externals[2], {
    type: 3,
    value1: 35,
    label: 'WAH',
    state1: 'OFF',
    state2: 'ON',
    toggleOnOff: true,
  });
  return { ...p, externals: p.externals };
}
function before() {
  const b = new Array(1024).fill(255);
  b.splice(720, 7, 165, 1, 4, 11, 13, 115, 1);
  b.splice(936, 7, 150, 0, 180, 3, 17, 29, 199);
  return b;
}
function snapshot(image: Uint8Array, base = before()) {
  const b = [...base];
  image.forEach((v, i) => {
    b[imageAddress(i)] = v;
  });
  b.splice(1020, 4, 67, 90, 2, 165);
  return b;
}
test('all external fields and internal actions round-trip while calibration is untouched', () => {
  const p = preset(),
    b = before(),
    image = buildImage(p, b, true),
    after = snapshot(image, b);
  assert.equal(image.length, EXTENDED_IMAGE_SIZE);
  assert.equal(imageAddress(image.length - 1), 1019);
  assert.deepEqual(after.slice(936, 943), b.slice(936, 943));
  assert.deepEqual(decodeSnapshot(after, createPreset()).preset, p);
  assert.deepEqual([...image.slice(0, 936)], [...buildImage(p, b)]);
  assert.equal(externalCommandText(p.externals[0], 0), '(PRESET)');
  assert.equal(externalCommandText(p.externals[0], 2), '(STOMP)');
  assert.equal(externalCommandText({ ...p.externals[2], value1: 42 }, 127), '(ON)');
});
test('old JSON preserves external EEPROM configuration and old EEPROM starts disabled', () => {
  const p = preset(),
    old = createPreset();
  delete old.externals;
  validatePreset(old);
  const b = snapshot(buildImage(p, before(), true));
  const rewritten = snapshot(buildImage(old, b, true));
  assert.deepEqual(decodeExternals(rewritten, crc16), p.externals);
  assert.deepEqual(decodeExternals(before(), crc16), createExternals());
});
test('56-character shared pool accepts its boundary and rejects overflow and invalid states', () => {
  const a = createExternals();
  a[0].label = 'X'.repeat(12);
  a[0].state1 = 'A'.repeat(10);
  a[0].state2 = 'B'.repeat(10);
  a[1].label = 'Y'.repeat(12);
  a[1].state1 = 'C'.repeat(10);
  a[1].state2 = 'II';
  const bytes = before();
  bytes.splice(943, 77, ...encodeExternals(a, crc16));
  assert.deepEqual(decodeExternals(bytes, crc16), a);
  a[2].label = 'Z';
  assert.throws(() => validateExternals(a), /56/);
  a[2].label = '';
  a[2].state1 = 'ç';
  assert.throws(() => validateExternals(a), /inválida/);
  a[2].state1 = '';
  a[2].type = 6;
  a[2].value1 = 3;
  assert.throws(() => validateExternals(a));
});
test('corrupt extension disables only external actions on read and reports the problem', () => {
  const p = preset(),
    b = snapshot(buildImage(p, before(), true));
  b[965] ^= 1;
  const decoded = decodeSnapshot(b, p);
  assert.equal(decoded.loaded, 54);
  assert.deepEqual(decoded.preset.pages, p.pages);
  assert.deepEqual(decoded.preset.externals, createExternals());
  assert.match(decoded.warnings[0], /corrompida/);
});
test('extended writer negotiates size, skips calibration in readback and rejects old firmware', async () => {
  const image = buildImage(preset(), before(), true),
    client = new SerialClient();
  client.canWrite = true;
  await assert.rejects(client.saveImage(image), /Atualize/);
  client.canExternal = true;
  const received: number[] = [];
  client.request = async (command, payload = []) => {
    if (command === 3) assert.deepEqual(payload, [crc16(image) >> 8, crc16(image) & 255, 3, 245]);
    if (command === 4) {
      assert.equal((payload[0] << 8) | payload[1], received.length);
      received.push(...payload.slice(2));
    }
    if (command === 5) assert.deepEqual(received, [...image]);
    return command === 2 ? snapshot(image) : [0];
  };
  await client.saveImage(image);
  client.request = async (command) => {
    const b = snapshot(image);
    b[1019] ^= 1;
    return command === 2 ? b : [0];
  };
  await assert.rejects(client.saveImage(image), /releitura/);
});
