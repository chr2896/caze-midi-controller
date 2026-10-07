import type { ChangeEvent } from 'react';
import { Button, FileButton } from './ui/Button';

interface Props {
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onExportPrevious: () => void;
  notice: string;
}
export function PresetFiles({ onImport, onExport, onExportPrevious, notice }: Props) {
  return (
    <>
      <p>Importe um preset ou exporte seu rascunho para guardar uma cópia.</p>
      <div className="files">
        <FileButton>
          Importar preset
          <input type="file" accept=".json,application/json" onChange={onImport} />
        </FileButton>
        <Button onClick={onExport}>Exportar preset ↗</Button>
        <Button onClick={onExportPrevious}>Baixar preset anterior de 3 páginas</Button>
      </div>
      <p role="status">{notice}</p>
    </>
  );
}
