import { createExternals, validateExternals } from './external-config';
import { INTERNAL_TEXT_BUDGET, internalTextUsage, needsPackedText } from './internal-text';
import type { MidiAction, Preset } from './types';
import { isInteger as integer, isRecord } from './validation';
export const types = [
  'EMPTY',
  'PG',
  'CC',
  'TOGGLE CC',
  'NEXT PAGE',
  'PREV PAGE',
  'GO TO PAGE',
  'TEMP PAGE',
];
export function createPreset(): Preset {
  return {
    version: 1,
    externals: createExternals(),
    pages: Array.from({ length: 3 }, () =>
      Array.from({ length: 6 }, () =>
        Array.from({ length: 3 }, () => ({
          type: 0,
          channel: 1,
          value1: 0,
          value2: 0,
          value3: 127,
          label: '',
          toggleOnOff: false,
        })),
      ),
    ),
  };
}
export function validatePreset(data: unknown): Preset {
  if (!isRecord(data)) throw Error('Preset inválido.');
  if (data?.externals !== undefined) validateExternals(data.externals);
  if (data?.version !== 1 || !Array.isArray(data.pages) || data.pages.length !== 3)
    throw Error('Preset inválido: são necessárias três páginas.');
  for (const page of data.pages) {
    if (!Array.isArray(page) || page.length !== 6)
      throw Error('Cada página precisa de seis footswitches.');
    for (const foot of page) {
      if (!Array.isArray(foot) || foot.length !== 3)
        throw Error('Cada footswitch precisa de três ações.');
      for (const action of foot) {
        if (
          !isRecord(action) ||
          !integer(action.type, 0, 7) ||
          !integer(action.channel, 1, 16) ||
          !['value1', 'value2', 'value3'].every((key) => integer(action[key], 0, 127)) ||
          ([6, 7].includes(action.type) &&
            typeof action.value1 === 'number' &&
            action.value1 > 2) ||
          (action.toggleOnOff !== undefined && typeof action.toggleOnOff !== 'boolean') ||
          (action.tapTempo !== undefined && typeof action.tapTempo !== 'boolean') ||
          !['state1', 'state2'].every(
            (key) =>
              action[key] === undefined ||
              (typeof action[key] === 'string' && /^[\x20-\x7E]{0,10}$/.test(action[key])),
          ) ||
          typeof action.label !== 'string' ||
          !/^[\x20-\x7E]{0,12}$/.test(action.label)
        )
          throw Error('Preset contém valores ou labels inválidos.');
      }
    }
  }
  const preset = data as unknown as Preset;
  if (needsPackedText(preset) && internalTextUsage(preset) > INTERNAL_TEXT_BUDGET)
    throw Error('Os nomes e estados dos foots 1–6 devem somar até 540 caracteres.');
  return preset;
}
export function isTapTempo(action: MidiAction) {
  return [2, 3].includes(action.type) && (action.tapTempo ?? action.value1 === 42);
}
export function commandText(action: MidiAction, active?: number) {
  if (isTapTempo(action)) return '-- BPM';
  const value = (x: number) => {
    if (action.toggleOnOff && action.value2 !== action.value3) {
      return x === Math.min(action.value2, action.value3) ? 'OFF' : 'ON';
    }
    return x === 0 ? 'OFF' : x === 127 ? 'ON' : String(x);
  };
  if (action.type === 3 && (action.state1 || action.state2)) {
    const text = (active ?? action.value2) === action.value2 ? action.state1 : action.state2;
    return `(${text || value(active ?? action.value2)})`;
  }
  if (action.type === 3)
    return [action.value2, action.value3]
      .map((x) => (x === active ? `(${value(x)})` : value(x)))
      .join(' ');
  if ([1, 2].includes(action.type))
    return `${types[action.type]} ${action.value1} ${action.value2}`;
  if ([6, 7].includes(action.type)) return `GO TO PAGE ${action.value1 + 1}`;
  return types[action.type];
}
