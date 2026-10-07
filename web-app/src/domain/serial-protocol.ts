import { errorMessage } from '../utils/errors';
import { decodeInternalText, PACKED_TEXT_FORMAT, TEXT_FORMAT_ADDRESS } from './internal-text';
import type { Bytes, Preset } from './types';
export interface Frame {
  command: number;
  sequence: number;
  payload: number[];
}

import { createExternals, decodeExternals } from './external-config';
import { crc16, storageState } from './storage-layout';

export function encodeFrame(command: number, sequence: number, payload: Bytes = []) {
  const encoded = Array.from(payload).flatMap((value) => [value >> 4, value & 15]);
  const checksum =
    (command + sequence + Array.from(payload).reduce((sum, value) => sum + value, 0)) & 127;
  return Uint8Array.from([240, 125, 67, 90, 1, command, sequence, ...encoded, checksum, 247]);
}

export class FrameParser {
  frame: number[] | null = null;
  onFrame: (frame: Frame) => void;
  constructor(onFrame: (frame: Frame) => void) {
    this.onFrame = onFrame;
  }
  push(bytes: Bytes) {
    for (const value of bytes) {
      if (value >= 248) continue;
      if (value === 240) {
        this.frame = [];
        continue;
      }
      if (value === 247) {
        const frame = this.frame;
        this.frame = null;
        if (
          !frame ||
          frame.length < 7 ||
          (frame.length - 7) % 2 ||
          ![125, 67, 90, 1].every((v, i) => frame[i] === v)
        )
          continue;
        const payload = [];
        let valid = true;
        for (let i = 6; i < frame.length - 1; i += 2) {
          if (frame[i] > 15 || frame[i + 1] > 15) {
            valid = false;
            break;
          }
          payload.push((frame[i] << 4) | frame[i + 1]);
        }
        const checksum = (frame[4] + frame[5] + payload.reduce((sum, v) => sum + v, 0)) & 127;
        if (valid && checksum === frame.at(-1))
          this.onFrame({ command: frame[4], sequence: frame[5], payload });
      } else if (this.frame) {
        if (value >= 128 || this.frame.length >= 2055) this.frame = null;
        else this.frame.push(value);
      }
    }
  }
}

export function decodeSnapshot(bytes: Bytes, draft: Preset) {
  if (bytes.length !== 1024) throw Error('Leitura incompleta da EEPROM.');
  const preset = structuredClone(draft);
  const warnings: string[] = [];
  const state = storageState(bytes);
  if (state === 'pending')
    return {
      preset,
      warnings: [
        'Gravação incompleta: use Recuperar gravação. Nenhum comando parcial foi carregado.',
      ],
      loaded: 0,
      state,
    };
  let loaded = 0;
  let packed: ReturnType<typeof decodeInternalText> | null = null;
  if (state === 'ready' && bytes[TEXT_FORMAT_ADDRESS] === PACKED_TEXT_FORMAT) {
    try {
      packed = decodeInternalText(bytes);
    } catch (error) {
      return { preset, warnings: [errorMessage(error)], loaded: 0, state };
    }
  }
  if (state === 'ready') {
    try {
      preset.externals = decodeExternals(bytes, crc16);
    } catch (error) {
      preset.externals = createExternals();
      warnings.push(errorMessage(error));
    }
  }
  for (let page = 0; page < 3; page++)
    for (let foot = 0; foot < 6; foot++)
      for (let gesture = 0; gesture < 3; gesture++) {
        const address = page * (state === 'ready' ? 30 : 48) + foot * 5 + gesture * 90;
        const [channel, type, value1, value2, value3] = bytes.slice(address, address + 5);
        const valid =
          type <= 7 &&
          channel >= 1 &&
          channel <= 16 &&
          [value1, value2, value3].every((v) => v <= 127) &&
          (![6, 7].includes(type) || value1 < 3);
        const location = `Página ${page + 1}, FS ${foot + 1}, ${['clique', 'longo', 'duplo'][gesture]}`;
        if (!valid) {
          warnings.push(
            `${location}: dados inválidos ou não configurados; rascunho local mantido.`,
          );
          continue;
        }
        Object.assign(preset.pages[page][foot][gesture], { channel, type, value1, value2, value3 });
        if (state === 'ready') {
          const index = address / 5;
          const action = preset.pages[page][foot][gesture];
          delete action.state1;
          delete action.state2;
          delete action.tapTempo;
          if (packed) Object.assign(action, packed[index]);
          else {
            const label = bytes.slice(270 + index * 12, 282 + index * 12);
            if (label.some((v) => v !== 0 && (v < 32 || v > 126)))
              warnings.push(`${location}: label inválido; label local mantido.`);
            else
              preset.pages[page][foot][gesture].label = String.fromCharCode(
                ...label.slice(0, label.includes(0) ? label.indexOf(0) : 12),
              );
          }

          preset.pages[page][foot][gesture].toggleOnOff = Boolean(
            bytes[918 + (index >> 3)] & (1 << (index % 8)),
          );
        }
        loaded++;
      }
  return { preset, warnings, loaded, state };
}
