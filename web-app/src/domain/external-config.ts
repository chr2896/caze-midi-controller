import { tapBits } from './internal-text';
import type { Bytes, Checksum, MidiAction } from './types';
import { isInteger as integer, isRecord } from './validation';
// Mirrors EEPROM 943..1019; existing configuration is unchanged.
export const EXTERNAL_ADDRESS = 943,
  EXTERNAL_SIZE = 77,
  TEXT_BUDGET = 56;
export const externalNames = ['Dual · superior', 'Dual · inferior', 'Ampero · toe switch'];
export const createExternals = (): MidiAction[] =>
  Array.from({ length: 3 }, () => ({
    type: 0,
    channel: 1,
    value1: 0,
    value2: 0,
    value3: 127,
    label: '',
    toggleOnOff: false,
    state1: '',
    state2: '',
  }));
export const externalTextUsage = (actions: MidiAction[]) =>
  actions.reduce(
    (sum, a) => sum + a.label.length + (a.state1 || '').length + (a.state2 || '').length,
    0,
  );
export function validateExternals(actions: unknown): MidiAction[] {
  if (!Array.isArray(actions) || actions.length !== 3)
    throw Error('São necessários três foots externos.');
  for (const a of actions) {
    if (
      !isRecord(a) ||
      !integer(a.type, 0, 7) ||
      !integer(a.channel, 1, 16) ||
      !['value1', 'value2', 'value3'].every((k) => integer(a[k], 0, 127)) ||
      ([6, 7].includes(a.type) && typeof a.value1 === 'number' && a.value1 > 2) ||
      (a.toggleOnOff !== undefined && typeof a.toggleOnOff !== 'boolean') ||
      (a.tapTempo !== undefined && typeof a.tapTempo !== 'boolean') ||
      typeof a.label !== 'string' ||
      !/^[\x20-\x7E]{0,12}$/.test(a.label) ||
      !['state1', 'state2'].every(
        (k) => a[k] === undefined || (typeof a[k] === 'string' && /^[\x20-\x7E]{0,10}$/.test(a[k])),
      )
    )
      throw Error('Configuração dos foots externos inválida.');
  }
  if (externalTextUsage(actions as MidiAction[]) > TEXT_BUDGET)
    throw Error('Os labels e estados dos três foots externos devem somar até 56 caracteres.');
  return actions as MidiAction[];
}
export function encodeExternals(actions: MidiAction[], crc16: Checksum) {
  validateExternals(actions);
  const bytes = new Uint8Array(EXTERNAL_SIZE);
  bytes[0] = 0xe3;
  let cursor = 19;
  actions.forEach((a, no) => {
    const offset = 1 + no * 6,
      strings = [a.label, a.state1 || '', a.state2 || ''];
    bytes.set(
      [
        ((a.channel - 1) << 4) | (a.toggleOnOff ? 8 : 0) | a.type,
        a.value1,
        a.value2,
        a.value3,
        (strings[0].length << 4) | strings[1].length,
        strings[2].length | tapBits(a),
      ],
      offset,
    );
    for (const text of strings) for (const char of text) bytes[cursor++] = char.charCodeAt(0);
  });
  const crc = crc16(bytes.slice(0, 75));
  bytes[75] = crc >> 8;
  bytes[76] = crc & 255;
  return bytes;
}
export function decodeExternals(snapshot: Bytes, crc16: Checksum) {
  const bytes = snapshot.slice(EXTERNAL_ADDRESS, EXTERNAL_ADDRESS + EXTERNAL_SIZE);
  if (bytes[0] !== 0xe3) return createExternals();
  if (crc16(bytes.slice(0, 75)) !== ((bytes[75] << 8) | bytes[76]))
    throw Error('Configuração externa corrompida; confira e grave novamente os foots externos.');
  let cursor = 19;
  const actions = Array.from({ length: 3 }, (_, no) => {
    const o = 1 + no * 6,
      lengths = [bytes[o + 4] >> 4, bytes[o + 4] & 15, bytes[o + 5] & 15];
    const [label, state1, state2] = lengths.map((length) => {
      const text = String.fromCharCode(...bytes.slice(cursor, cursor + length));
      cursor += length;
      return text;
    });
    if (bytes[o + 5] >> 4 > 2) throw Error('Configuração externa corrompida.');
    return {
      ...(bytes[o + 5] & 48 ? { tapTempo: (bytes[o + 5] & 48) === 16 } : {}),
      channel: (bytes[o] >> 4) + 1,
      type: bytes[o] & 7,
      toggleOnOff: Boolean(bytes[o] & 8),
      value1: bytes[o + 1],
      value2: bytes[o + 2],
      value3: bytes[o + 3],
      label,
      state1,
      state2,
    };
  });
  return validateExternals(actions);
}
export function externalCommandText(action: MidiAction, active: number) {
  if (action.type === 3) {
    const custom = active === action.value2 ? action.state1 : action.state2;
    const value =
      custom ||
      (action.toggleOnOff && action.value2 !== action.value3
        ? active === Math.min(action.value2, action.value3)
          ? 'OFF'
          : 'ON'
        : active === 0
          ? 'OFF'
          : active === 127
            ? 'ON'
            : String(active));
    return `(${value})`;
  }
  if (action.type === 2) return `CC ${action.value1} ${action.value2}`;
  if (action.type === 1) return `PG ${action.value1} ${action.value2}`;
  return null;
}
