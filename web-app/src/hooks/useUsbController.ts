import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { parseRecovery } from '../domain/recovery';
import { decodeSnapshot } from '../domain/serial-protocol';
import { buildImage } from '../domain/storage-layout';
import type { Preset, RecoveryBundle } from '../domain/types';
import { SerialClient } from '../services/serial-client';
import { downloadFile } from '../utils/download';
import { errorMessage } from '../utils/errors';

const recoveryKey = 'caze-midi-write-recovery-v2';
function loadRecovery(): RecoveryBundle | null {
  try {
    return parseRecovery(JSON.parse(localStorage.getItem(recoveryKey) ?? 'null'));
  } catch {
    return null;
  }
}
export function useUsbController(
  preset: Preset,
  onLoad: (preset: Preset, synced?: boolean) => void,
  onRead: (preset: Preset | null) => void,
) {
  const client = useRef<SerialClient | null>(null);
  const [connected, setConnected] = useState(false),
    [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Ative USB MODE com FS4 + FS6 antes de conectar.');
  const [snapshot, setSnapshot] = useState<number[] | null>(null);
  const [canWrite, setCanWrite] = useState(false),
    [recovery, setRecovery] = useState(loadRecovery);
  useEffect(
    () => () => {
      void client.current?.close();
    },
    [],
  );
  async function connect() {
    setBusy(true);
    setSnapshot(null);
    onRead(null);
    setMessage('Selecione a porta do Nano. Aguardando inicialização e identificação…');
    const next = new SerialClient(() => {
      setConnected(false);
      setMessage('Nano desconectado. A última leitura permanece disponível.');
    });
    client.current = next;
    try {
      await next.connect();
      setConnected(true);
      setCanWrite(next.canWrite);
      setMessage('Nano identificado. Clique em Ler controlador para obter a configuração salva.');
      return true;
    } catch (error) {
      setConnected(false);
      setMessage(
        (error instanceof Error ? error.name : null) === 'NotFoundError'
          ? 'Seleção da porta cancelada.'
          : errorMessage(error),
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function read() {
    setBusy(true);
    setMessage('Lendo EEPROM…');
    try {
      const bytes = await requireClient().request(2);
      if (bytes.length !== 1024) throw Error('Leitura incompleta. Tente novamente.');
      setSnapshot(bytes);
      const result = decodeSnapshot(bytes, preset);
      onRead(
        result.loaded === 45 && !result.warnings.length && result.state === 'ready'
          ? result.preset
          : null,
      );
      setMessage('Leitura concluída. Seu rascunho ainda não foi alterado.');
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function disconnect() {
    setBusy(true);
    await client.current?.close();
    setConnected(false);
    setBusy(false);
    setMessage('Porta liberada.');
  }
  function downloadSnapshot() {
    if (!snapshot) return;
    downloadFile(
      Uint8Array.from(snapshot),
      'caze-midi-eeprom-1024.bin',
      'application/octet-stream',
    );
  }
  async function save(retry = false) {
    setBusy(true);
    try {
      setMessage('Preparando backup e validando preset…');
      const bundle: RecoveryBundle | null = retry
        ? recovery
        : {
            version: 2,
            includeExternals: requireClient().canExternal === true,
            created: new Date().toISOString(),
            preset: structuredClone(preset),
            before: await requireClient().request(2),
          };
      if (!bundle) throw Error('Importe o arquivo de recuperação salvo antes da gravação.');
      if (
        !bundle.includeExternals &&
        bundle.preset.externals?.some((a) => a.type !== 0 || a.label || a.state1 || a.state2)
      )
        throw Error('Atualize o firmware para salvar a configuração dos foots externos.');
      const image = buildImage(bundle.preset, bundle.before, bundle.includeExternals === true);
      // A failed local backup must abort before BEGIN; never start without recovery data.
      localStorage.setItem(recoveryKey, JSON.stringify(bundle));
      setRecovery(bundle);
      if (!retry)
        downloadFile(
          JSON.stringify(bundle, null, 2),
          `caze-midi-backup-${Date.now()}.json`,
          'application/json',
        );
      const bytes = await requireClient().saveImage(image, (percent) =>
        setMessage(`Gravando ${percent}% — mantenha a USB conectada.`),
      );
      setSnapshot(bytes);
      onLoad(decodeSnapshot(bytes, bundle.preset).preset, true);
      setMessage(
        'Gravação concluída e conferida pela releitura. Nomes e textos dos estados já estão no Nano.',
      );
    } catch (error) {
      setMessage(`Não foi possível concluir: ${errorMessage(error)}`);
    } finally {
      setBusy(false);
    }
  }
  async function importRecovery(event: ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 100000) throw Error('Arquivo muito grande.');
      const bundle = parseRecovery(JSON.parse(await file.text()));
      localStorage.setItem(recoveryKey, JSON.stringify(bundle));
      setRecovery(bundle);
      setMessage(
        'Arquivo de recuperação carregado. Recuperar gravação enviará o preset contido nesse arquivo.',
      );
    } catch (error) {
      setMessage(errorMessage(error));
    }
    event.target.value = '';
  }
  const decoded = snapshot ? decodeSnapshot(snapshot, preset) : null;
  function requireClient() {
    if (!client.current) throw Error('Nano desconectado.');
    return client.current;
  }
  function applyReading() {
    if (!decoded) return;
    onLoad(
      decoded.preset,
      decoded.loaded === 45 && decoded.warnings.length === 0 && decoded.state === 'ready',
    );
    setMessage('Leitura carregada no editor. Nada foi gravado no Nano.');
  }
  return {
    connected,
    busy,
    message,
    snapshot,
    canWrite,
    recovery,
    decoded,
    connect,
    disconnect,
    read,
    save,
    downloadSnapshot,
    importRecovery,
    applyReading,
  };
}
