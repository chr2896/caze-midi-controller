import type { Preset } from '../domain/types';
import { useUsbController } from '../hooks/useUsbController';
import { UsbPanelRoot } from './UsbPanel.styles';
import { Button, FileButton } from './ui/Button';

interface Props {
  preset: Preset;
  onLoad: (preset: Preset) => void;
}
export function UsbPanel({ preset, onLoad }: Props) {
  const {
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
  } = useUsbController(preset, onLoad);
  return (
    <UsbPanelRoot aria-label="Conexão USB">
      <div className="section-title">
        <h2>
          <span className="connection-dot" aria-hidden="true" /> Controlador USB
        </h2>
        <span>
          {connected
            ? canWrite
              ? 'CONECTADO · LEITURA E GRAVAÇÃO'
              : 'CONECTADO · SOMENTE LEITURA'
            : 'DESCONECTADO'}
        </span>
      </div>
      <details className="connection-help">
        <summary>Como conectar e salvar</summary>
        <p>
          Ative USB MODE com FS4 + FS6 e saia dos menus. Leia e carregue o Nano antes de editar.
          Salvar envia as 54 ações e os três externos no firmware atualizado. A configuração e a
          calibração da expressão serão preservadas.
        </p>
      </details>
      {!('serial' in navigator) && (
        <p>Este navegador não oferece Web Serial. Abra este mesmo endereço no Chrome ou Edge.</p>
      )}
      <div className="usb-actions">
        <Button
          disabled={busy || !('serial' in navigator)}
          onClick={connected ? disconnect : connect}
        >
          {connected ? 'Desconectar' : busy ? 'Conectando…' : 'Conectar controlador'}
        </Button>
        <Button disabled={busy || !connected} onClick={read}>
          Ler controlador
        </Button>
        {snapshot && (
          <Button disabled={busy} onClick={downloadSnapshot}>
            Baixar backup da EEPROM
          </Button>
        )}
        <Button
          className="save-controller"
          disabled={busy || !connected || !canWrite || !snapshot || decoded?.state === 'pending'}
          onClick={() => save()}
        >
          Salvar preset no controlador
        </Button>
      </div>
      <p role="status">{message}</p>
      {decoded && (
        <div className="usb-result">
          <p>
            {decoded.loaded} de 54 ações válidas.{' '}
            {decoded.state === 'ready'
              ? 'Labels e ON/OFF foram lidos do Nano.'
              : 'Labels locais serão preservados ao carregar comandos antigos.'}
          </p>
          <Button disabled={busy || !decoded.loaded} onClick={applyReading}>
            Substituir comandos locais pela leitura
          </Button>
          <details>
            <summary>
              Observações da leitura{decoded.warnings.length ? ` (${decoded.warnings.length})` : ''}
            </summary>
            <p>
              {decoded.state === 'legacy'
                ? 'Memória antiga: existem sobreposições entre ações. Confira os comandos antes de salvar; a primeira gravação usa o novo mapa sem sobreposições e cria um backup de recuperação.'
                : decoded.state === 'pending'
                  ? 'Gravação interrompida: o Nano aguarda a recuperação por USB.'
                  : 'Mapa v2: comandos, labels, expressão e modo USB ocupam regiões separadas.'}
            </p>
            {decoded.warnings.length > 0 && (
              <ul>
                {decoded.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </details>
        </div>
      )}
      <details className="recovery">
        <summary>Recuperação de gravação</summary>
        <p>
          Se o envio foi interrompido, repita usando o último preset guardado antes da gravação.
          Após reiniciar, o Nano permanece em USB até concluir a recuperação.
        </p>
        {recovery && (
          <p>
            Recuperação disponível: {recovery.created || 'arquivo importado'}. O envio usará esse
            preset, não as edições posteriores no editor.
          </p>
        )}
        <div className="usb-actions">
          <Button
            disabled={busy || !connected || !canWrite || !recovery}
            onClick={() => save(true)}
          >
            Recuperar gravação
          </Button>
          <FileButton>
            Importar recuperação
            <input
              disabled={busy}
              type="file"
              accept=".json,application/json"
              onChange={importRecovery}
            />
          </FileButton>
        </div>
      </details>
    </UsbPanelRoot>
  );
}
