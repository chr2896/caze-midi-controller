import { version } from '../../package.json';
import { t } from '../i18n';
import { AppHeaderRoot } from './AppHeader.styles';
import { LanguageMenu } from './LanguageMenu';
import { Button } from './ui/Button';

interface Props {
  onOpenFiles: () => void;
  onOpenUsb: () => void;
}
export function AppHeader({ onOpenFiles, onOpenUsb }: Props) {
  return (
    <AppHeaderRoot>
      <div className="brand">
        <img src="./caze-icon.svg" width="64" height="64" alt="" />
        <h1>
          CAZE MIDI CTRL
          <small>
            EDITOR <span>{version}</span>
          </small>
        </h1>
      </div>
      <nav aria-label={t('Ferramentas')}>
        <Button
          onClick={onOpenFiles}
          title={t('Importar um preset ou exportar uma cópia em arquivo')}
        >
          {' '}
          {t('Importar / Exportar')}{' '}
        </Button>
        <Button
          className="primary"
          onClick={onOpenUsb}
          title={t('Conectar por USB, ler configurações e salvar no pedal')}
        >
          {' '}
          {t('Ler / Salvar')}{' '}
        </Button>
        <LanguageMenu />
      </nav>
    </AppHeaderRoot>
  );
}
