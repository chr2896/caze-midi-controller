import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeFrame, FrameParser, decodeSnapshot } from './serial-protocol.js';
import { SerialClient } from './serial-client.js';
import { createPreset } from './preset.js';

test('fixed request bytes match the firmware protocol', () => {
  assert.deepEqual([...encodeFrame(1, 1)], [240, 125, 67, 90, 1, 1, 1, 2, 247]);
});
test('1024-byte snapshot survives fragmented delivery and interleaved realtime', () => {
  const payload = Array.from({ length: 1024 }, (_, i) => i % 256);
  const results = [], parser = new FrameParser(frame => results.push(frame));
  parser.push([176, 11, 127]);
  for (const byte of encodeFrame(66, 7, payload)) parser.push([byte, 248]);
  assert.equal(results.length, 1);
  assert.deepEqual(results[0], { command: 66, sequence: 7, payload });
});
test('bad checksum, oversized, interrupted and foreign frames are ignored; next frame recovers', () => {
  const results = [], parser = new FrameParser(frame => results.push(frame));
  const corrupt = encodeFrame(65, 1, [3, 6]); corrupt[8] ^= 1;
  parser.push(corrupt);
  parser.push([240, ...new Array(2100).fill(0), 247]);
  parser.push([240, 125, 67, 176, 11, 0, 247]);
  const foreign = encodeFrame(65, 1); foreign[2] = 68; parser.push(foreign);
  parser.push(encodeFrame(65, 2, [3]));
  assert.equal(results.length, 1); assert.equal(results[0].sequence, 2);
});
test('EEPROM decode uses legacy addresses, preserves labels/options and skips invalid actions', () => {
  const bytes = new Array(1024).fill(255), draft = createPreset();
  draft.pages[0][0][0].label = 'SOLO'; draft.pages[0][0][0].toggleOnOff = true;
  bytes.splice(0, 5, 1, 3, 20, 0, 127);
  bytes.splice(301, 5, 2, 2, 21, 100, 0);
  const result = decodeSnapshot(bytes, draft);
  assert.equal(result.loaded, 2); assert.equal(result.warnings.length, 52);
  assert.equal(result.preset.pages[0][0][0].label, 'SOLO');
  assert.equal(result.preset.pages[0][0][0].toggleOnOff, true);
  assert.equal(result.preset.pages[2][5][2].value1, 21);
  assert.equal(draft.pages[0][0][0].type, 0);
  assert.throws(() => decodeSnapshot(bytes.slice(1), draft));
});

function fakeClient() {
  let controller;
  const readable = new ReadableStream({ start(c) { controller = c; } });
  const client = new SerialClient();
  client.port = {
    writable: new WritableStream({ write(bytes) {
      const sequence = bytes[6], command = bytes[5] | 64;
      controller.enqueue(encodeFrame(command, sequence === 1 ? 2 : 1, [99]));
      controller.enqueue(encodeFrame(command, sequence, [3, 6, 3, 48, 90, 5, 1]));
    } }),
    async close() { assert.equal(readable.locked, false); assert.equal(this.writable.locked, false); },
  };
  client.reader = readable.getReader(); client.loop = client.readLoop();
  return { client, controller };
}
test('serial client ignores stale replies and releases stream locks on close', async () => {
  const { client } = fakeClient();
  assert.deepEqual(await client.request(1), [3, 6, 3, 48, 90, 5, 1]);
  await client.close(); assert.equal(client.port, null);
});
test('disconnect rejects an outstanding request and clears its timeout', async () => {
  const { client, controller } = fakeClient();
  client.port.writable = new WritableStream({ write() { controller.close(); } });
  await assert.rejects(client.request(2), /encerrada/);
  await client.loop;
});
