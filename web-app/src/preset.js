export const types = ['EMPTY', 'PG', 'CC', 'TOGGLE CC', 'NEXT PAGE', 'PREV PAGE', 'GO TO PAGE', 'TEMP PAGE'];
export function createPreset() {
  return { version: 1, pages: Array.from({ length: 3 }, () => Array.from({ length: 6 }, () =>
    Array.from({ length: 3 }, () => ({ type: 0, channel: 1, value1: 0, value2: 0, value3: 127, label: '', toggleOnOff: false })))) };
}
export function validatePreset(data) {
  const integer = (x, low, high) => Number.isInteger(x) && x >= low && x <= high;
  if (data?.version !== 1 || !Array.isArray(data.pages) || data.pages.length !== 3) throw Error('Preset inválido: são necessárias três páginas.');
  for (const page of data.pages) {
    if (!Array.isArray(page) || page.length !== 6) throw Error('Cada página precisa de seis footswitches.');
    for (const foot of page) {
      if (!Array.isArray(foot) || foot.length !== 3) throw Error('Cada footswitch precisa de três ações.');
      for (const action of foot) {
        if (!action || !integer(action.type, 0, 7) || !integer(action.channel, 1, 16) ||
            !['value1', 'value2', 'value3'].every(key => integer(action[key], 0, 127)) ||
            ([6, 7].includes(action.type) && action.value1 > 2) ||
            (action.toggleOnOff !== undefined && typeof action.toggleOnOff !== 'boolean') ||
            typeof action.label !== 'string' || !/^[\x20-\x7E]{0,12}$/.test(action.label)) throw Error('Preset contém valores ou labels inválidos.');
      }
    }
  }
  return data;
}
export function isTapTempo(action) { return [2, 3].includes(action.type) && action.value1 === 42; }
export function commandText(action, active) {
  if (isTapTempo(action)) return '-- BPM';
  const value = x => {
    if (action.toggleOnOff && action.value2 !== action.value3) {
      return x === Math.min(action.value2, action.value3) ? 'OFF' : 'ON';
    }
    return x === 0 ? 'OFF' : x === 127 ? 'ON' : String(x);
  };
  if (action.type === 3) return [action.value2, action.value3].map(x => x === active ? `(${value(x)})` : value(x)).join(' ');
  if ([1, 2].includes(action.type)) return `${types[action.type]} ${action.value1} ${action.value2}`;
  if ([6, 7].includes(action.type)) return `GO TO PAGE ${action.value1 + 1}`;
  return types[action.type];
}
