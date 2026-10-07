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
) {
  const external = foot >= 6;
  const tap = external
    ? action.tapTempo === true && [2, 3].includes(action.type)
    : isTapTempo(action);
  const header =
    action.label ||
    (tap ? 'TAP TEMPO' : `${external ? '' : ['', 'LNG ', 'DBL '][gesture]}FS ${foot + 1}`);
  const line1 =
    action.label || tap || external
      ? `${header.padEnd(13)}EXP`
      : `${header.padEnd(9)}P${page + 1}  EXP`;
  const text = tap
    ? '-- BPM'
    : external
      ? (externalCommandText(action, action[`value${activeSlot}`]) ??
        commandText(action, action[`value${activeSlot}`]))
      : commandText(action, action[`value${activeSlot}`]);
  const line2 = text.slice(0, 12).padEnd(12) + `${Math.round((midi * 100) / 127)}%`.padStart(4);
  return { line1, line2 };
}
