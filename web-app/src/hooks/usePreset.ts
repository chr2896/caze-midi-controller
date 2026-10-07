import { type ChangeEvent, useState } from 'react';
import { createGlobalExternals } from '../domain/external-config';
import { createPreset, emptyAction, presetSignature, validatePreset } from '../domain/preset';
import type { MidiAction, Preset } from '../domain/types';
import { downloadFile } from '../utils/download';
import { errorMessage } from '../utils/errors';

const storageKey = 'midi-controller-preset-v1';
function loadPreset() {
  const migrationNotice =
    'Duas páginas: páginas 1/2 e cliques externos preservados. Página 3 e destinos antigos ficam no backup, disponível em Importar / Exportar.';
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { preset: createPreset(), notice: '' };
    const parsed: unknown = JSON.parse(raw);
    const legacy =
      typeof parsed === 'object' && parsed && 'version' in parsed && parsed.version === 1;
    if (legacy && !localStorage.getItem(`${storageKey}-before-two-pages`))
      localStorage.setItem(`${storageKey}-before-two-pages`, raw);
    return { preset: validatePreset(parsed), notice: legacy ? migrationNotice : '' };
  } catch (error) {
    return {
      preset: createPreset(),
      notice: `Não foi possível carregar o rascunho antigo: ${errorMessage(error)}. O original permanece no armazenamento; recupere-o antes de salvar no Nano.`,
    };
  }
}
export function usePreset(page: number, foot: number, gesture: number) {
  const [initial] = useState(loadPreset);
  const [preset, setPreset] = useState(initial.preset);
  const [syncedPreset, setSyncedPreset] = useState<string | null>(null);
  const [edited, setEdited] = useState(false);
  const pendingChanges = syncedPreset !== null ? presetSignature(preset) !== syncedPreset : edited;
  const [notice, setNotice] = useState(initial.notice);
  const external = foot >= 6;
  const externals = preset.externals ?? createGlobalExternals();
  const action = external ? externals[(foot - 6) * 3 + gesture] : preset.pages[page][foot][gesture];
  function update(patch: Partial<MidiAction>) {
    const next = structuredClone(preset);
    if (external) {
      next.externals ??= createGlobalExternals();
      Object.assign(next.externals[(foot - 6) * 3 + gesture], patch);
    } else Object.assign(next.pages[page][foot][gesture], patch);
    try {
      validatePreset(next);
    } catch (error) {
      setNotice(errorMessage(error));
      return false;
    }
    setEdited(true);
    setPreset(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setNotice('Rascunho salvo neste navegador.');
    } catch {
      setNotice('Não foi possível salvar no navegador. Exporte seu preset.');
    }
    return true;
  }
  function resetFoot() {
    const next = structuredClone(preset);
    if (external) {
      next.externals ??= createGlobalExternals();
      next.externals.splice((foot - 6) * 3, 3, emptyAction(), emptyAction(), emptyAction());
    } else {
      next.pages[page][foot] = [emptyAction(), emptyAction(), emptyAction()];
    }
    setEdited(true);
    setPreset(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setNotice('Foot restaurado ao padrão. Salve no controlador para aplicar.');
    } catch {
      setNotice('Não foi possível salvar no navegador. Exporte seu preset.');
    }
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 100000) throw Error('Arquivo muito grande.');
      const parsed: unknown = JSON.parse(await file.text());
      const legacy =
        typeof parsed === 'object' && parsed && 'version' in parsed && parsed.version === 1;
      const next = validatePreset(parsed);
      next.externals ??= structuredClone(externals); // Old presets do not erase the global draft.
      validatePreset(next);
      setEdited(true);
      setPreset(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
        setNotice(
          legacy
            ? 'Preset migrado: páginas 1/2 e cliques externos importados. Página 3 continua no arquivo original; destinos da página 3 foram ajustados para página 2.'
            : 'Preset importado e salvo neste navegador.',
        );
      } catch {
        setNotice('Preset importado, mas sem persistência local.');
      }
    } catch (error) {
      setNotice(`Não foi possível importar: ${errorMessage(error)}`);
    }
    event.target.value = '';
  }
  function exportPrevious() {
    const raw = localStorage.getItem(`${storageKey}-before-two-pages`);
    if (raw) downloadFile(raw, 'caze-midi-preset-original-3-paginas.json', 'application/json');
    else
      setNotice(
        'Não há backup de três páginas neste navegador. Arquivos importados continuam no arquivo original.',
      );
  }
  function exportFile() {
    downloadFile(
      JSON.stringify(preset, null, 2),
      'midi-controller-preset.json',
      'application/json',
    );
  }
  function applyUsbPreset(next: Preset, synced = false) {
    setSyncedPreset(synced ? presetSignature(next) : null);
    setEdited(true);
    setPreset(next);
    try {
      localStorage.setItem(`${storageKey}-before-usb`, JSON.stringify(preset));
      localStorage.setItem(storageKey, JSON.stringify(next));
      setNotice('Configuração do Nano carregada no editor.');
    } catch {
      setNotice('Leitura aplicada, mas não foi possível salvar no navegador. Exporte o preset.');
    }
  }
  return {
    preset,
    pendingChanges,
    compareReading: (next: Preset | null) => setSyncedPreset(next ? presetSignature(next) : null),
    synced: syncedPreset !== null && !pendingChanges,
    externals,
    action,
    notice,
    update,
    resetFoot,
    importFile,
    exportFile,
    exportPrevious,
    applyUsbPreset,
  };
}
