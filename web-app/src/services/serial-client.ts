import { PACKED_TEXT_FORMAT, TEXT_FORMAT_ADDRESS } from '../domain/internal-text';

interface PendingRequest {
  command: number;
  sequence: number;
  resolve: (payload: number[]) => void;
  reject: (error: unknown) => void;
}
export type SerialConnection = Pick<SerialPort, 'writable' | 'close'>;

import { encodeFrame, FrameParser } from '../domain/serial-protocol';
import {
  crc16,
  EXTENDED_IMAGE_SIZE,
  IMAGE_SIZE,
  imageAddress,
  storageState,
} from '../domain/storage-layout';

export class SerialClient {
  sequence = 0;
  pending: PendingRequest | null = null;
  closing = false;
  port: SerialConnection | null = null;
  reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  loop: Promise<void> | undefined;
  canWrite = false;
  canExternal = false;
  canPackedText = false;
  canUnified = false;
  onDisconnect: () => void;
  constructor(onDisconnect: () => void = () => {}) {
    this.onDisconnect = onDisconnect;
  }
  async connect() {
    if (!navigator.serial)
      throw Error(
        'Web Serial indisponível. Abra o editor no Chrome ou Edge pelo endereço localhost.',
      );
    const port = await navigator.serial.requestPort();
    this.port = port;
    try {
      await port.open({ baudRate: 115200 });
      if (!port.readable) throw Error('Porta USB sem fluxo de leitura.');
      this.reader = port.readable.getReader();
      this.loop = this.readLoop();
      // Opening a Nano serial port can reset it; wait through bootloader + LCD welcome.
      await new Promise((resolve) => setTimeout(resolve, 4500));
      const info = await this.request(1);
      if (
        info.length !== 7 ||
        !([2, 3].includes(info[0]) && info[1] === 6 && info[2] === 3) ||
        ![30, 48].includes(info[3]) ||
        ![60, 90].includes(info[4]) ||
        info[5] !== 5 ||
        ![1, 3, 7, 15, 31].includes(info[6])
      )
        throw Error('Firmware ou formato de memória incompatível com esta versão do editor.');
      this.canUnified = Boolean(info[6] & 16);
      this.canWrite = this.canUnified;
      this.canExternal = Boolean(info[6] & 4);
      this.canPackedText = Boolean(info[6] & 8);
    } catch (error) {
      await this.close();
      throw error;
    }
  }
  async readLoop() {
    const reader = this.reader;
    if (!reader) return;
    const parser = new FrameParser((frame) => {
      if (
        this.pending &&
        frame.sequence === this.pending.sequence &&
        frame.command === (this.pending.command | 64)
      ) {
        this.pending.resolve(frame.payload);
      }
    });
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        parser.push(value);
      }
    } catch {
      /* Disconnect is handled below, including any pending request. */
    } finally {
      reader.releaseLock();
      this.reader = null;
      this.pending?.reject(Error('Conexão USB encerrada.'));
      if (!this.closing) {
        this.onDisconnect();
        // Do not await our own readLoop from close().
        queueMicrotask(() => this.close());
      }
    }
  }
  async request(command: number, payload: number[] = []): Promise<number[]> {
    if (!this.reader || !this.port?.writable) throw Error('Nano desconectado.');
    if (this.pending) throw Error('Aguarde a leitura em andamento.');
    this.sequence = (this.sequence % 127) + 1;
    const sequence = this.sequence;
    return new Promise<number[]>((resolve, reject) => {
      const finish = <T>(callback: (result: T) => void, result: T) => {
        clearTimeout(timer);
        this.pending = null;
        callback(result);
      };
      const timer = setTimeout(
        () =>
          this.pending?.reject(
            Error(
              'Sem resposta. Atualize o firmware, ative USB MODE (FS4 + FS6) e feche outros programas que usam a porta.',
            ),
          ),
        5000,
      );
      this.pending = {
        command,
        sequence,
        resolve: (payload) => finish(resolve, payload),
        reject: (error) => finish(reject, error),
      };
      this.write(encodeFrame(command, sequence, payload)).catch((error) => {
        if (this.pending?.sequence === sequence) this.pending.reject(error);
      });
    });
  }
  async saveImage(image: Uint8Array, progress: (percent: number) => void = () => {}) {
    if (!this.canWrite || !this.canUnified)
      throw Error(
        'Atualize o firmware para duas páginas, gestos externos e modos EXP antes de gravar.',
      );
    if (![IMAGE_SIZE, EXTENDED_IMAGE_SIZE].includes(image.length))
      throw Error('Imagem de configuração inválida.');
    if (image.length === EXTENDED_IMAGE_SIZE && !this.canExternal)
      throw Error('Atualize o firmware para gravar os foots externos.');
    const packed = image[TEXT_FORMAT_ADDRESS] === PACKED_TEXT_FORMAT;
    if (packed && !this.canPackedText)
      throw Error(
        'Atualize o firmware para gravar os textos dos estados e comandos da biblioteca Quad Cortex mini.',
      );
    const checked = async (command: number, payload: number[] = []) => {
      const reply = await this.request(command, payload);
      if (reply[0] === 2) throw Error('Saia dos menus de configuração no Nano antes de salvar.');
      if (reply.length !== 1 || reply[0] !== 0)
        throw Error('O Nano recusou a gravação. Use Recuperar gravação para repetir o envio.');
    };
    const crc = crc16(image);
    await checked(3, [
      crc >> 8,
      crc & 255,
      ...(image.length === EXTENDED_IMAGE_SIZE || packed
        ? [image.length >> 8, image.length & 255]
        : []),
      ...(packed ? [4] : []),
    ]);
    for (let offset = 0; offset < image.length; offset += 16) {
      await checked(4, [offset >> 8, offset & 255, ...image.slice(offset, offset + 16)]);
      progress(Math.round((Math.min(offset + 16, image.length) * 100) / image.length));
    }
    await checked(5);
    const verified = await this.request(2);
    if (
      verified.length !== 1024 ||
      storageState(verified) !== 'ready' ||
      verified[1022] !== 3 ||
      !image.every((v, i) => verified[imageAddress(i)] === v)
    )
      throw Error('A releitura não confirmou todos os dados. Reconecte e use Recuperar gravação.');
    return verified;
  }
  async write(bytes: Uint8Array<ArrayBuffer>) {
    if (!this.port?.writable) throw Error('Nano desconectado.');
    const writer = this.port.writable.getWriter();
    try {
      await writer.write(bytes);
    } finally {
      writer.releaseLock();
    }
  }
  async close() {
    if (this.closing) return;
    this.closing = true;
    this.pending?.reject(Error('Conexão encerrada.'));
    try {
      await this.reader?.cancel();
    } catch {
      /* Device may already be removed. */
    }
    await this.loop;
    try {
      await this.port?.close();
    } catch {
      /* Already closed or physically disconnected. */
    }
    this.port = null;
  }
}
