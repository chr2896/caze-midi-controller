import { encodeFrame, FrameParser } from './serial-protocol.js';

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
      if (info.join(',') !== '3,6,3,48,90,5,1') throw Error('Firmware ou formato de memória incompatível com esta versão do editor.');
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
  async request(command) {
    if (!this.reader || !this.port?.writable) throw Error('Nano desconectado.');
    if (this.pending) throw Error('Aguarde a leitura em andamento.');
    const sequence = this.sequence = this.sequence % 127 + 1;
    return new Promise((resolve, reject) => {
      const finish = (callback, result) => { clearTimeout(timer); this.pending = null; callback(result); };
      const timer = setTimeout(() => this.pending?.reject(Error('Sem resposta. Atualize o firmware, ative USB MODE (FS4 + FS6) e feche outros programas que usam a porta.')), 5000);
      this.pending = { command, sequence, resolve: payload => finish(resolve, payload), reject: error => finish(reject, error) };
      this.write(encodeFrame(command, sequence)).catch(error => {
        if (this.pending?.sequence === sequence) this.pending.reject(error);
      });
    });
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
