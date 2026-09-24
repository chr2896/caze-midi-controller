import React, { useEffect, useRef, useState } from 'react';
import { SerialClient } from './serial-client.js';
import { decodeSnapshot } from './serial-protocol.js';

export default function UsbReader({ preset, onLoad }) {
  const client = useRef(null);
  const [connected, setConnected] = useState(false), [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Atualize o firmware e ative USB MODE com FS4 + FS6 antes de conectar.');
  const [snapshot, setSnapshot] = useState(null);
  useEffect(() => () => { void client.current?.close(); }, []);
  async function connect() {
    setBusy(true); setSnapshot(null); setMessage('Selecione a porta do Nano. Aguardando inicialização e identificação…');
    const next = new SerialClient(() => { setConnected(false); setMessage('Nano desconectado. A última leitura permanece disponível.'); });
    client.current = next;
    try {
      await next.connect(); setConnected(true);
      setMessage('Nano identificado. Clique em Ler controlador para obter a configuração salva.');
    } catch (error) {
      setConnected(false);
      setMessage(error.name === 'NotFoundError' ? 'Seleção da porta cancelada.' : error.message);
    } finally { setBusy(false); }
  }
  async function read() {
    setBusy(true); setMessage('Lendo EEPROM…');
    try {
      const bytes = await client.current.request(2);
      if (bytes.length !== 1024) throw Error('Leitura incompleta. Tente novamente.');
      setSnapshot(bytes); setMessage('Leitura concluída. Seu rascunho ainda não foi alterado.');
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  async function disconnect() {
    setBusy(true);
    await client.current?.close(); setConnected(false); setBusy(false); setMessage('Porta liberada.');
  }
  function downloadSnapshot() {
    const url = URL.createObjectURL(new Blob([Uint8Array.from(snapshot)], { type: 'application/octet-stream' }));
    const link = document.createElement('a'); link.href = url; link.download = 'caze-midi-eeprom-1024.bin'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const decoded = snapshot ? decodeSnapshot(snapshot, preset) : null;
  return <section className="usb-reader" aria-label="Conexão USB">
    <div className="section-title"><h2>Controlador USB</h2><span>{connected ? 'CONECTADO · SOMENTE LEITURA' : 'DESCONECTADO'}</span></div>
    <p>Leia as configurações salvas no Nano. Nesta etapa, o editor não grava no controlador.</p>
    {!('serial' in navigator) && <p>Este navegador não oferece Web Serial. Abra este mesmo endereço no Chrome ou Edge.</p>}
    <div className="usb-actions">
      <button disabled={busy || !('serial' in navigator)} onClick={connected ? disconnect : connect}>{connected ? 'Desconectar' : busy ? 'Conectando…' : 'Conectar controlador'}</button>
      <button disabled={busy || !connected} onClick={read}>Ler controlador</button>
      {snapshot && <button disabled={busy} onClick={downloadSnapshot}>Baixar backup da EEPROM</button>}
    </div>
    <p role="status">{message}</p>
    {decoded && <div className="usb-result">
      <p>{decoded.loaded} de 54 ações válidas. Labels e opção ON/OFF são locais e serão preservados.</p>
      <button disabled={busy || !decoded.loaded} onClick={() => {
        onLoad(decoded.preset);
        setMessage('Comandos válidos carregados no editor. Nada foi gravado no Nano.');
      }}>Substituir comandos locais pela leitura</button>
      <details><summary>Observações da leitura{decoded.warnings.length ? ` (${decoded.warnings.length})` : ''}</summary>
        <p>O firmware usa um mapa de memória legado com sobreposições e endereços além do buffer RAM. Esta leitura retrata a EEPROM, não garante o comportamento em execução dessas ações. O mapa será revisado antes da gravação pelo app.</p>
        {decoded.warnings.length > 0 && <ul>{decoded.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>}
      </details>
    </div>}
  </section>;
}
