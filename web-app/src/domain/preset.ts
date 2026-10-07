import { createGlobalExternals, validateExternals } from './external-config';
import { INTERNAL_TEXT_BUDGET, internalTextUsage } from './internal-text';
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
  'EXP / EXP2',
  'TOGGLE CC',
];
export const emptyAction = (): MidiAction => ({
  type: 0,
  channel: 1,
  value1: 0,
  value2: 0,
  value3: 127,
  label: '',
  toggleOnOff: false,
});
export function createPreset(): Preset {
  return {
    version: 2,
    externals: createGlobalExternals(),
    pages: Array.from({ length: 2 }, () =>
      Array.from({ length: 6 }, () => Array.from({ length: 3 }, emptyAction)),
    ),
  };
}
export function validateAction(action: unknown, legacy = false): asserts action is MidiAction {
  if (
    !isRecord(action) ||
    !integer(action.type, 0, legacy ? 7 : 9) ||
    !integer(action.channel, 1, 16) ||
    !['value1', 'value2', 'value3'].every((key) => integer(action[key], 0, 127)) ||
    ([6, 7].includes(action.type) &&
      typeof action.value1 === 'number' &&
      action.value1 > (legacy ? 2 : 1)) ||
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
export function validatePreset(data: unknown): Preset {
  if (
    !isRecord(data) ||
    (data.version !== 1 && data.version !== 2) ||
    !Array.isArray(data.pages) ||
    data.pages.length !== (data.version === 1 ? 3 : 2)
  )
    throw Error('Preset inválido: são necessárias duas páginas (ou três no formato antigo).');
  const legacy = data.version === 1;
  for (const page of data.pages) {
    if (!Array.isArray(page) || page.length !== 6)
      throw Error('Cada página precisa de seis footswitches.');
    for (const foot of page) {
      if (!Array.isArray(foot) || foot.length !== 3)
        throw Error('Cada footswitch precisa de três ações.');
      for (const action of foot) validateAction(action, legacy);
    }
  }
  if (data.externals !== undefined) {
    if (legacy) validateExternals(data.externals);
    else {
      if (!Array.isArray(data.externals) || data.externals.length !== 9)
        throw Error('São necessárias nove ações externas.');
      for (const a of data.externals) validateAction(a);
    }
  }
  const preset = structuredClone(data) as unknown as Preset;
  if (legacy) {
    preset.version = 2;
    preset.pages = preset.pages.slice(0, 2);
    if (data.externals !== undefined) {
      preset.externals = createGlobalExternals();
      (data.externals as MidiAction[]).forEach((a, i) => {
        preset.externals?.splice(i * 3, 1, structuredClone(a));
      });
    }
    for (const a of [...preset.pages.flat(2), ...(preset.externals ?? [])])
      if ([6, 7].includes(a.type) && a.value1 === 2) a.value1 = 1;
  }
  for (const a of [...preset.pages.flat(2), ...(preset.externals ?? [])]) {
    if (!a.state1) delete a.state1;
    if (!a.state2) delete a.state2;
  }
  if (internalTextUsage(preset) > INTERNAL_TEXT_BUDGET)
    throw Error(`Nomes e estados das 45 ações devem somar até ${INTERNAL_TEXT_BUDGET} caracteres.`);
  return preset;
}
export function isTapTempo(action: MidiAction) {
  return [2, 3].includes(action.type) && (action.tapTempo ?? action.value1 === 42);
}
export function commandText(action: MidiAction, active?: number) {
  if (action.type === 8) return 'EXP / EXP2';
  if (action.type === 9) return 'PAGE I / II';
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
