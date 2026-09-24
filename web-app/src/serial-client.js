import { encodeFrame, FrameParser } from './serial-protocol.js';
import { crc16, IMAGE_SIZE, storageState } from './storage-layout.js';

export class SerialClient {
  sequence = 0;
  pending = null;
  closing = false;
  constructor(onDisconnect = () => {}) { this.onDisconnect = onDisconnect; }
  async connect() {
    if (!navigator.serial) throw Error('Web Serial indisponível. Abra o editor no Chrome ou Edge pelo endereço localhost.');
    this.port = await navigator.serial.requestPort();
    try {
      await this.port.open({ baudRate: 115200 });
      this.reader = this.port.readable.getReader();
      this.loop = this.readLoop();
      // Opening a Nano serial port can reset it; wait through bootloader + LCD welcome.
      await new Promise(resolve => setTimeout(resolve, 4500));
      const info = await this.request(1);
      if (info.length !== 7 || ![3, 6, 3].every((v, i) => info[i] === v) || ![30, 48].includes(info[3]) || info[4] !== 90 || info[5] !== 5 || ![1, 3].includes(info[6])) throw Error('Firmware ou formato de memória incompatível com esta versão do editor.');
      this.canWrite = info[6] === 3;
    } catch (error) { await this.close(); throw error; }
  }
  async readLoop() {
    const parser = new FrameParser(frame => {
      if (this.pending && frame.sequence === this.pending.sequence && frame.command === (this.pending.command | 64)) {
        this.pending.resolve(frame.payload);
      }
    });
    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break;
        parser.push(value);
      }
    } catch { /* Disconnect is handled below, including any pending request. */ }
    finally {
      this.reader.releaseLock(); this.reader = null;
      this.pending?.reject(Error('Conexão USB encerrada.'));
      if (!this.closing) {
        this.onDisconnect();
        // Do not await our own readLoop from close().
        queueMicrotask(() => this.close());
      }
    }
  }
  async request(command, payload = []) {
    if (!this.reader || !this.port?.writable) throw Error('Nano desconectado.');
    if (this.pending) throw Error('Aguarde a leitura em andamento.');
    const sequence = this.sequence = this.sequence % 127 + 1;
    return new Promise((resolve, reject) => {
      const finish = (callback, result) => { clearTimeout(timer); this.pending = null; callback(result); };
      const timer = setTimeout(() => this.pending?.reject(Error('Sem resposta. Atualize o firmware, ative USB MODE (FS4 + FS6) e feche outros programas que usam a porta.')), 5000);
      this.pending = { command, sequence, resolve: payload => finish(resolve, payload), reject: error => finish(reject, error) };
      this.write(encodeFrame(command, sequence, payload)).catch(error => {
        if (this.pending?.sequence === sequence) this.pending.reject(error);
      });
    });
  }
  async saveImage(image, progress = () => {}) {
    if (!this.canWrite) throw Error('Atualize o firmware para habilitar gravação.');
    if (image.length !== IMAGE_SIZE) throw Error('Imagem de configuração inválida.');
    const checked = async (command, payload = []) => {
      const reply = await this.request(command, payload);
      if (reply[0] === 2) throw Error('Saia dos menus de configuração no Nano antes de salvar.');
      if (reply.length !== 1 || reply[0] !== 0) throw Error('O Nano recusou a gravação. Use Recuperar gravação para repetir o envio.');
    };
    const crc = crc16(image);
    await checked(3, [crc >> 8, crc & 255]);
    for (let offset = 0; offset < image.length; offset += 16) {
      await checked(4, [offset >> 8, offset & 255, ...image.slice(offset, offset + 16)]);
      progress(Math.round(Math.min(offset + 16, image.length) * 100 / image.length));
    }
    await checked(5);
    const verified = await this.request(2);
    if (verified.length !== 1024 || storageState(verified) !== 'ready' || !image.every((v, i) => verified[i] === v)) throw Error('A releitura não confirmou todos os dados. Reconecte e use Recuperar gravação.');
    return verified;
  }
  async write(bytes) {
    const writer = this.port.writable.getWriter();
    try { await writer.write(bytes); } finally { writer.releaseLock(); }
  }
  async close() {
    if (this.closing) return;
    this.closing = true;
    this.pending?.reject(Error('Conexão encerrada.'));
    try { await this.reader?.cancel(); } catch { /* Device may already be removed. */ }
    await this.loop;
    try { await this.port?.close(); } catch { /* Already closed or physically disconnected. */ }
    this.port = null;
  }
}
