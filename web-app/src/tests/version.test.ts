import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('editor and firmware release versions stay aligned', () => {
  const { version } = JSON.parse(
    readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
  );
  const firmware = readFileSync(
    new URL('../../../src/open-midi-controller.ino', import.meta.url),
    'utf8',
  );
  assert.equal(firmware.match(/#define REVISION "([^"]+)"/)?.[1], version);
});
