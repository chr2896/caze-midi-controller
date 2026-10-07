import { readFileSync } from 'node:fs';
import { imageAddress } from '../domain/storage-layout';
export function before() {
  const b: number[] = Array(1024).fill(255);
  b.splice(720, 7, 165, 1, 4, 11, 13, 115, 1);
  b.splice(936, 7, 150, 0, 180, 3, 17, 29, 199);
  return b;
}
export function snapshot(image: Uint8Array, base = before()) {
  const b = [...base];
  image.forEach((v, i) => {
    b[imageAddress(i)] = v;
  });
  b.splice(1020, 4, 67, 90, 3, 165);
  return b;
}
export function legacySnapshot(packed = false) {
  const image = readFileSync(
    new URL(
      `../../../tests/firmware/fixtures/legacy-${packed ? 'packed' : 'fixed'}.bin`,
      import.meta.url,
    ),
  );
  const b = before();
  image.forEach((v, i) => {
    b[imageAddress(i)] = v;
  });
  b.splice(1020, 4, 67, 90, 2, 165);
  return b;
}
