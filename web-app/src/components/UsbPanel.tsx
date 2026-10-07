import type { useUsbController } from '../hooks/useUsbController';
import { t } from '../i18n';
import { UsbPanelRoot } from './UsbPanel.styles';
import { Button, FileButton } from './ui/Button';

interface Props {
  controller: ReturnType<typeof useUsbController>;
}
export function UsbPanel({ controller }: Props) {
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
  } = controller;
  return (
    <UsbPanelRoot aria-label={t('Conexão USB')}>
      <div className="section-title">
        <h2>
          <span className="connection-dot" aria-hidden="true" /> {t('Controlador USB')}{' '}
        </h2>
        <span>
          {connected
            ? canWrite
              ? t('CONECTADO · LEITURA E GRAVAÇÃO')
              : t('CONECTADO · SOMENTE LEITURA')
            : t('DESCONECTADO')}
        </span>
      </div>
      <details className="connection-help">
        <summary>{t('Como conectar e salvar')}</summary>
        <p>
          {' '}
          {t(
            'Ative USB MODE com FS4 + FS6 e saia dos menus. Leia e carregue o Nano antes de editar. Salvar envia as 36 ações internas e nove externas no firmware atualizado. A configuração e a calibração da expressão serão preservadas.',
          )}{' '}
        </p>
      </details>
      {!('serial' in navigator) && (
        <p>
          {t('Este navegador não oferece Web Serial. Abra este mesmo endereço no Chrome ou Edge.')}
        </p>
      )}
      <div className="usb-actions">
        <Button
          disabled={busy || !('serial' in navigator)}
          onClick={connected ? disconnect : connect}
        >
          {connected ? t('Desconectar') : busy ? t('Conectando…') : t('Conectar controlador')}
        </Button>
        <Button disabled={busy || !connected} onClick={read}>
          {' '}
          {t('Ler controlador')}{' '}
        </Button>
        {snapshot && (
          <Button disabled={busy} onClick={downloadSnapshot}>
            {' '}
            {t('Baixar backup da EEPROM')}{' '}
          </Button>
        )}
        <Button
          className="save-controller"
          disabled={busy || !connected || !canWrite || !snapshot || decoded?.state === 'pending'}
          onClick={() => save()}
        >
          {' '}
          {t('Salvar preset no controlador')}{' '}
        </Button>
      </div>
      <p role="status">{t(message)}</p>
      {decoded && (
        <div className="usb-result">
          <p>
            {decoded.loaded} {t('ações válidas carregadas.')}{' '}
            {decoded.state === 'ready'
              ? t('Nomes e estados foram lidos do Nano.')
              : t('Labels locais serão preservados ao carregar comandos antigos.')}
          </p>
          <Button disabled={busy || !decoded.loaded} onClick={applyReading}>
            {' '}
            {t('Substituir comandos locais pela leitura')}{' '}
          </Button>
          <details>
            <summary>
              {' '}
              {t('Observações da leitura')}
              {decoded.warnings.length ? ` (${decoded.warnings.length})` : ''}
            </summary>
            <p>
              {decoded.state === 'legacy'
                ? t(
                    'Memória antiga: existem sobreposições entre ações. Confira os comandos antes de salvar; a primeira gravação usa o novo mapa sem sobreposições e cria um backup de recuperação.',
                  )
                : decoded.state === 'pending'
                  ? t('Gravação interrompida: o Nano aguarda a recuperação por USB.')
                  : t('Mapa v2: comandos, labels, expressão e modo USB ocupam regiões separadas.')}
            </p>
            {decoded.warnings.length > 0 && (
              <ul>
                {decoded.warnings.map((warning) => (
                  <li key={t(warning)}>{t(warning)}</li>
                ))}
              </ul>
            )}
          </details>
        </div>
      )}
      <details className="recovery">
        <summary>{t('Recuperação de gravação')}</summary>
        <p>
          {' '}
          {t(
            'Se o envio foi interrompido, repita usando o último preset guardado antes da gravação. Após reiniciar, o Nano permanece em USB até concluir a recuperação.',
          )}{' '}
        </p>
        {recovery && (
          <p>
            {' '}
            {t('Recuperação disponível:')} {recovery.created || t('arquivo importado')}
            {t('. O envio usará esse preset, não as edições posteriores no editor.')}{' '}
          </p>
        )}
        <div className="usb-actions">
          <Button
            disabled={busy || !connected || !canWrite || !recovery}
            onClick={() => save(true)}
          >
            {' '}
            {t('Recuperar gravação')}{' '}
          </Button>
          <FileButton>
            {' '}
            {t('Importar recuperação')}{' '}
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
