export function encodeFrame(command, sequence, payload = []) {
  const encoded = Array.from(payload).flatMap(value => [value >> 4, value & 15]);
  const checksum = (command + sequence + Array.from(payload).reduce((sum, value) => sum + value, 0)) & 127;
  return Uint8Array.from([240, 125, 67, 90, 1, command, sequence, ...encoded, checksum, 247]);
}

export class FrameParser {
  frame = null;
  constructor(onFrame) { this.onFrame = onFrame; }
  push(bytes) {
    for (const value of bytes) {
      if (value >= 248) continue;
      if (value === 240) { this.frame = []; continue; }
      if (value === 247) {
        const frame = this.frame; this.frame = null;
        if (!frame || frame.length < 7 || (frame.length - 7) % 2 ||
            ![125, 67, 90, 1].every((v, i) => frame[i] === v)) continue;
        const payload = [];
        let valid = true;
        for (let i = 6; i < frame.length - 1; i += 2) {
          if (frame[i] > 15 || frame[i + 1] > 15) { valid = false; break; }
          payload.push((frame[i] << 4) | frame[i + 1]);
        }
        const checksum = (frame[4] + frame[5] + payload.reduce((sum, v) => sum + v, 0)) & 127;
        if (valid && checksum === frame.at(-1)) this.onFrame({ command: frame[4], sequence: frame[5], payload });
      } else if (this.frame) {
        if (value >= 128 || this.frame.length >= 2055) this.frame = null;
        else this.frame.push(value);
      }
    }
  }
}

export function decodeSnapshot(bytes, draft) {
  if (bytes.length !== 1024) throw Error('Leitura incompleta da EEPROM.');
  const preset = structuredClone(draft);
  const warnings = [];
  let loaded = 0;
  for (let page = 0; page < 3; page++) for (let foot = 0; foot < 6; foot++) for (let gesture = 0; gesture < 3; gesture++) {
    const address = page * 48 + foot * 5 + gesture * 90;
    const [channel, type, value1, value2, value3] = bytes.slice(address, address + 5);
    const valid = type <= 7 && channel >= 1 && channel <= 16 &&
      [value1, value2, value3].every(v => v <= 127) && (![6, 7].includes(type) || value1 < 3);
    const location = `Página ${page + 1}, FS ${foot + 1}, ${['clique', 'longo', 'duplo'][gesture]}`;
    if (!valid) { warnings.push(`${location}: dados inválidos ou não configurados; rascunho local mantido.`); continue; }
    Object.assign(preset.pages[page][foot][gesture], { channel, type, value1, value2, value3 });
    loaded++;
  }
  return { preset, warnings, loaded };
}
