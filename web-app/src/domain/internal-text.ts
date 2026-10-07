import type { Bytes, MidiAction, Preset } from './types';
export const TEXT_FORMAT_ADDRESS = 925;
export const PACKED_TEXT_FORMAT = 0xa4;
export const INTERNAL_TEXT_BUDGET = 603;
const TEXT_START = 315;
export function orderedActions(preset: Preset): MidiAction[] {
  return [
    ...[0, 1, 2].flatMap((g) => preset.pages.flatMap((page) => page.map((foot) => foot[g]))),
    ...(preset.externals ?? []),
  ];
}
export function internalTextUsage(preset: Preset) {
  return orderedActions(preset).reduce(
    (sum, a) => sum + a.label.length + (a.state1?.length ?? 0) + (a.state2?.length ?? 0),
    0,
  );
}
export function tapBits(action: MidiAction) {
  return action.tapTempo === undefined ? 0 : action.tapTempo ? 16 : 32;
}
export function encodeInternalText(preset: Preset, image: Uint8Array) {
  if (internalTextUsage(preset) > INTERNAL_TEXT_BUDGET)
    throw Error('Os nomes e estados das 45 ações devem somar até 603 caracteres.');
  let cursor = TEXT_START;
  orderedActions(preset).forEach((a, index) => {
    const texts = [a.label, a.state1 || '', a.state2 || ''];
    image[225 + index * 2] = (texts[0].length << 4) | texts[1].length;
    image[226 + index * 2] = texts[2].length | tapBits(a);
    for (const text of texts) for (const char of text) image[cursor++] = char.charCodeAt(0);
  });
  image[TEXT_FORMAT_ADDRESS] = PACKED_TEXT_FORMAT;
}
export function decodeInternalText(bytes: Bytes, legacy = false) {
  let cursor = legacy ? 378 : TEXT_START;
  return Array.from({ length: legacy ? 54 : 45 }, (_, index) => {
    const first = bytes[(legacy ? 270 : 225) + index * 2],
      second = bytes[(legacy ? 271 : 226) + index * 2];
    const lengths = [first >> 4, first & 15, second & 15];
    if (
      lengths[0] > 12 ||
      lengths[1] > 10 ||
      lengths[2] > 10 ||
      second >> 4 > 2 ||
      cursor + lengths.reduce((a, b) => a + b, 0) > 918
    )
      throw Error('Textos internos corrompidos.');
    const [label, state1, state2] = lengths.map((length) => {
      const text = bytes.slice(cursor, cursor + length);
      cursor += length;
      if (text.some((v) => v < 32 || v > 126)) throw Error('Textos internos corrompidos.');
      return String.fromCharCode(...text);
    });
    return {
      label,
      ...(state1 ? { state1 } : {}),
      ...(state2 ? { state2 } : {}),
      ...(second & 48 ? { tapTempo: (second & 48) === 16 } : {}),
    };
  });
}
