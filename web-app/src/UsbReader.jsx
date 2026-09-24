import React, { useEffect, useRef, useState } from 'react';
import { SerialClient } from './serial-client.js';
import { decodeSnapshot } from './serial-protocol.js';
import { buildImage } from './storage-layout.js';

const recoveryKey = 'caze-midi-write-recovery-v2';
function loadRecovery() {
  try { const data = JSON.parse(localStorage.getItem(recoveryKey)); buildImage(data.preset, data.before); return data; }
  catch { return null; }
}
function downloadFile(data, name, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function UsbReader({ preset, onLoad }) {
  const client = useRef(null);
  const [connected, setConnected] = useState(false), [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Atualize o firmware e ative USB MODE com FS4 + FS6 antes de conectar.');
  const [snapshot, setSnapshot] = useState(null);
  const [canWrite, setCanWrite] = useState(false), [recovery, setRecovery] = useState(loadRecovery);
  useEffect(() => () => { void client.current?.close(); }, []);
  async function connect() {
    setBusy(true); setSnapshot(null); setMessage('Selecione a porta do Nano. Aguardando inicialização e identificação…');
    const next = new SerialClient(() => { setConnected(false); setMessage('Nano desconectado. A última leitura permanece disponível.'); });
    client.current = next;
    try {
      await next.connect(); setConnected(true); setCanWrite(next.canWrite);
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
  async function save(retry = false) {
    setBusy(true);
    try {
      setMessage('Preparando backup e validando preset…');
      const bundle = retry ? recovery : { version: 2, created: new Date().toISOString(), preset: structuredClone(preset), before: await client.current.request(2) };
      if (!bundle) throw Error('Importe o arquivo de recuperação salvo antes da gravação.');
      const image = buildImage(bundle.preset, bundle.before);
      // A failed local backup must abort before BEGIN; never start without recovery data.
      localStorage.setItem(recoveryKey, JSON.stringify(bundle));
      setRecovery(bundle);
      if (!retry) downloadFile(JSON.stringify(bundle, null, 2), `caze-midi-backup-${Date.now()}.json`, 'application/json');
      const bytes = await client.current.saveImage(image, percent => setMessage(`Gravando ${percent}% — mantenha a USB conectada.`));
      setSnapshot(bytes);
      onLoad(decodeSnapshot(bytes, bundle.preset).preset);
      setMessage('Gravação concluída e conferida pela releitura. Labels e ON/OFF já estão no Nano.');
    } catch (error) { setMessage(`Não foi possível concluir: ${error.message}`); }
    finally { setBusy(false); }
  }
  async function importRecovery(event) {
    try {
      const file = event.target.files[0]; if (!file) return;
      if (file.size > 100000) throw Error('Arquivo muito grande.');
      const bundle = JSON.parse(await file.text());
      if (bundle.version !== 2) throw Error('Formato de recuperação inválido.');
      buildImage(bundle.preset, bundle.before);
      localStorage.setItem(recoveryKey, JSON.stringify(bundle)); setRecovery(bundle);
      setMessage('Arquivo de recuperação carregado. Recuperar gravação enviará o preset contido nesse arquivo.');
    } catch (error) { setMessage(error.message); }
    event.target.value = '';
  }
  const decoded = snapshot ? decodeSnapshot(snapshot, preset) : null;
  return <section className="usb-reader" aria-label="Conexão USB">
    <div className="section-title"><h2>Controlador USB</h2><span>{connected ? (canWrite ? 'CONECTADO · LEITURA E GRAVAÇÃO' : 'CONECTADO · SOMENTE LEITURA') : 'DESCONECTADO'}</span></div>
    <p>Leia o Nano antes de editar. Salvar envia o preset inteiro: 54 ações, labels e ON/OFF. A configuração de expressão atual será preservada.</p>
    {!('serial' in navigator) && <p>Este navegador não oferece Web Serial. Abra este mesmo endereço no Chrome ou Edge.</p>}
    <div className="usb-actions">
      <button disabled={busy || !('serial' in navigator)} onClick={connected ? disconnect : connect}>{connected ? 'Desconectar' : busy ? 'Conectando…' : 'Conectar controlador'}</button>
      <button disabled={busy || !connected} onClick={read}>Ler controlador</button>
      {snapshot && <button disabled={busy} onClick={downloadSnapshot}>Baixar backup da EEPROM</button>}
      <button disabled={busy || !connected || !canWrite || !snapshot || decoded?.state === 'pending'} onClick={() => save()}>Salvar preset no controlador</button>
    </div>
    <p role="status">{message}</p>
    {decoded && <div className="usb-result">
      <p>{decoded.loaded} de 54 ações válidas. {decoded.state === 'ready' ? 'Labels e ON/OFF foram lidos do Nano.' : 'Labels locais serão preservados ao carregar comandos antigos.'}</p>
      <button disabled={busy || !decoded.loaded} onClick={() => {
        onLoad(decoded.preset);
        setMessage('Leitura carregada no editor. Nada foi gravado no Nano.');
      }}>Substituir comandos locais pela leitura</button>
      <details><summary>Observações da leitura{decoded.warnings.length ? ` (${decoded.warnings.length})` : ''}</summary>
        <p>{decoded.state === 'legacy' ? 'Memória antiga: existem sobreposições entre ações. Confira os comandos antes de salvar; a primeira gravação usa o novo mapa sem sobreposições e cria um backup de recuperação.' : decoded.state === 'pending' ? 'Gravação interrompida: o Nano aguarda a recuperação por USB.' : 'Mapa v2: comandos, labels, expressão e modo USB ocupam regiões separadas.'}</p>
        {decoded.warnings.length > 0 && <ul>{decoded.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>}
      </details>
    </div>}
    <details className="recovery"><summary>Recuperação de gravação</summary>
      <p>Se o envio foi interrompido, repita usando o último preset guardado antes da gravação. Após reiniciar, o Nano permanece em USB até concluir a recuperação.</p>
      {recovery && <p>Recuperação disponível: {recovery.created || 'arquivo importado'}. O envio usará esse preset, não as edições posteriores no editor.</p>}
      <div className="usb-actions"><button disabled={busy || !connected || !canWrite || !recovery} onClick={() => save(true)}>Recuperar gravação</button>
        <label className="button">Importar recuperação<input disabled={busy} type="file" accept=".json,application/json" onChange={importRecovery}/></label>
      </div>
    </details>
  </section>;
}
