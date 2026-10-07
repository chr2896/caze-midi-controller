import { AppHeaderRoot } from './AppHeader.styles';
import { Button } from './ui/Button';

interface Props {
  onOpenFiles: () => void;
  onOpenUsb: () => void;
}
export function AppHeader({ onOpenFiles, onOpenUsb }: Props) {
  return (
    <AppHeaderRoot>
      <div className="brand">
        <span className="logo" aria-hidden="true">
          C
        </span>
        <h1>
          CAZE MIDI CTRL
          <small>
            EDITOR <span>2.0</span>
          </small>
        </h1>
      </div>
      <nav aria-label="Ferramentas">
        <Button onClick={onOpenFiles} title="Importar um preset ou exportar uma cópia em arquivo">
          Importar / Exportar
        </Button>
        <Button
          className="primary"
          onClick={onOpenUsb}
          title="Conectar por USB, ler configurações e salvar no pedal"
        >
          Ler / Salvar
        </Button>
      </nav>
    </AppHeaderRoot>
  );
}
