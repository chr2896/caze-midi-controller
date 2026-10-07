import { createGlobalExternals, EXTERNAL_SIZE } from './external-config';
import { encodeInternalText, orderedActions } from './internal-text';
import { createPreset, validatePreset } from './preset';
import { decodeSnapshot } from './serial-protocol';
import type { Bytes, Preset } from './types';

export const IMAGE_SIZE = 936;
export const EXTENDED_IMAGE_SIZE = IMAGE_SIZE + EXTERNAL_SIZE;
export const imageAddress = (offset: number) => (offset < IMAGE_SIZE ? offset : offset + 7);
export function storageState(bytes: Bytes) {
  if (bytes[1020] !== 67 || bytes[1021] !== 90 || ![2, 3].includes(bytes[1022])) return 'legacy';
  return bytes[1023] === 165 ? 'ready' : 'pending';
}
export function crc16(bytes: Bytes) {
  let crc = 65535;
  for (const value of bytes) {
    crc ^= value << 8;
    for (let bit = 0; bit < 8; bit++) crc = ((crc << 1) ^ (crc & 32768 ? 0x1021 : 0)) & 65535;
  }
  return crc;
}
export function validateSnapshot(bytes: unknown): number[] {
  if (
    !Array.isArray(bytes) ||
    bytes.length !== 1024 ||
    !bytes.every((v) => Number.isInteger(v) && v >= 0 && v <= 255)
  )
    throw Error('Backup da EEPROM inválido.');
  return bytes;
}
export function buildImage(preset: Preset, before: number[], _includeExternals = false) {
  const normalized = validatePreset(preset);
  normalized.externals ??=
    decodeSnapshot(before, createPreset()).preset.externals ?? createGlobalExternals();
  validatePreset(normalized);
  validateSnapshot(before);
  if (storageState(before) === 'pending')
    throw Error('Use Recuperar gravação com o backup anterior; a EEPROM atual está incompleta.');
  const image = new Uint8Array(IMAGE_SIZE);
  const actions = orderedActions(normalized);
  actions.forEach((action, index) => {
    image.set(
      [action.channel, action.type, action.value1, action.value2, action.value3],
      index * 5,
    );
    if (action.toggleOnOff) image[918 + (index >> 3)] |= 1 << (index % 8);
  });
  encodeInternalText(normalized, image);
  const expAddress = storageState(before) === 'ready' ? 928 : 720;
  const exp = before.slice(expAddress, expAddress + 7);
  if (
    exp[0] !== 165 ||
    exp[1] > 1 ||
    exp[2] < 1 ||
    exp[2] > 16 ||
    exp.slice(3, 6).some((v) => v > 127) ||
    exp[6] > 1
  ) {
    throw Error(
      'Configuração de expressão inválida no Nano. Configure e salve a expressão pelo menu antes de gravar pelo app.',
    );
  }
  image.set(exp, 928);
  image[935] = 1; // Keep USB active for acknowledgement and verification.
  return image;
}
