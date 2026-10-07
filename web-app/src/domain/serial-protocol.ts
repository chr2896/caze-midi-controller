import { errorMessage } from '../utils/errors';
import { decodeInternalText, PACKED_TEXT_FORMAT, TEXT_FORMAT_ADDRESS } from './internal-text';
import { validateAction } from './preset';
import type { Bytes, Preset } from './types';
export interface Frame {
  command: number;
  sequence: number;
  payload: number[];
}

import { createGlobalExternals, decodeExternals } from './external-config';
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
  const preset = structuredClone(draft),
    warnings: string[] = [];
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
  const unified = state === 'ready' && bytes[1022] === 3;
  if (!unified)
    warnings.push(
      'Migração para duas páginas: mantidas páginas 1/2 e clique dos externos; página 3 permanece apenas no backup. Destinos da página 3 passam à página 2.',
    );
  let packed: ReturnType<typeof decodeInternalText> | null = null;
  if (state === 'ready' && (unified || bytes[TEXT_FORMAT_ADDRESS] === 0xa3)) {
    try {
      if (unified && bytes[TEXT_FORMAT_ADDRESS] !== PACKED_TEXT_FORMAT)
        throw Error('Formato de textos inválido.');
      packed = decodeInternalText(bytes, !unified);
    } catch (error) {
      return { preset, warnings: [errorMessage(error)], loaded: 0, state };
    }
  }
  if (!unified) {
    preset.externals = createGlobalExternals();
    if (state === 'ready')
      try {
        decodeExternals(bytes, crc16).forEach((a, i) => {
          if ([6, 7].includes(a.type) && a.value1 === 2) a.value1 = 1;
          preset.externals?.splice(i * 3, 1, a);
        });
      } catch (error) {
        warnings.push(errorMessage(error));
      }
  } else preset.externals = createGlobalExternals();
  let loaded = 0;
  for (let slot = 0; slot < 45; slot++) {
    const external = slot >= 36;
    if (external && !unified) continue;
    const gesture = external ? (slot - 36) % 3 : Math.floor(slot / 12),
      page = external ? 0 : Math.floor((slot % 12) / 6),
      foot = external ? Math.floor((slot - 36) / 3) : slot % 6;
    const address = unified
      ? slot * 5
      : page * (state === 'ready' ? 30 : 48) + foot * 5 + gesture * 90;
    const [channel, type, value1, value2, value3] = bytes.slice(address, address + 5);
    const action = external ? preset.externals[slot - 36] : preset.pages[page][foot][gesture];
    const incoming = { ...action, channel, type, value1, value2, value3 };
    try {
      validateAction(incoming, !unified);
    } catch {
      warnings.push(`FS ${foot + (external ? 7 : 1)}: dados inválidos; rascunho mantido.`);
      continue;
    }
    Object.assign(action, incoming);
    if (!unified && [6, 7].includes(type) && value1 === 2) action.value1 = 1;
    if (state === 'ready') {
      const index = address / 5;
      delete action.state1;
      delete action.state2;
      delete action.tapTempo;
      if (packed) Object.assign(action, packed[index]);
      else {
        const label = bytes.slice(270 + index * 12, 282 + index * 12);
        if (label.some((v) => v !== 0 && (v < 32 || v > 126)))
          warnings.push('Label inválido; texto local mantido.');
        else
          action.label = String.fromCharCode(
            ...label.slice(0, label.includes(0) ? label.indexOf(0) : 12),
          );
      }
      action.toggleOnOff = Boolean(bytes[918 + (index >> 3)] & (1 << (index % 8)));
    }
    loaded++;
  }
  return { preset, warnings, loaded, state };
}
