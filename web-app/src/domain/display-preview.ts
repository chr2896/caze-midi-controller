import { externalCommandText } from './external-config';
import { commandText, isTapTempo } from './preset';
import type { ActiveSlot, MidiAction } from './types';
export function displayPreview(
  action: MidiAction,
  foot: number,
  page: number,
  gesture: number,
  midi: number,
  activeSlot: ActiveSlot,
  expressionMode = 0,
) {
  const external = foot >= 6;
  const tap = external
    ? action.tapTempo === true && [2, 3].includes(action.type)
    : isTapTempo(action);
  const header =
    action.label || (tap ? 'TAP TEMPO' : `${['', 'LNG ', 'DBL '][gesture]}FS ${foot + 1}`);
  const expHeader = expressionMode === 2 ? 'EXP2' : ' EXP';
  if (action.type === 8) {
    return {
      line1: ' '.repeat(12) + expHeader,
      line2: ' '.repeat(12) + `${Math.round((midi * 100) / 127)}%`.padStart(4),
    };
  }
  const line1 =
    action.label || tap || external
      ? `${header.padEnd(12)}${expHeader}`
      : `${header.padEnd(9)}P${page + 1} ${expHeader}`;
  const text =
    action.type === 9
      ? (page ? action.state2 : action.state1)
        ? `(${page ? action.state2 : action.state1})`
        : `PAGE ${page ? 'II / P2' : 'I / P1'}`
      : tap
        ? '-- BPM'
        : external
          ? (externalCommandText(action, action[`value${activeSlot}`]) ??
            commandText(action, action[`value${activeSlot}`]))
          : commandText(action, action[`value${activeSlot}`]);
  const line2 = text.slice(0, 12).padEnd(12) + `${Math.round((midi * 100) / 127)}%`.padStart(4);
  return { line1, line2 };
}
