import { type ChangeEvent, useState } from 'react';
import { createExternals, validateExternals } from '../domain/external-config';
import { createPreset, validatePreset } from '../domain/preset';
import type { MidiAction, Preset } from '../domain/types';
import { downloadFile } from '../utils/download';
import { errorMessage } from '../utils/errors';

const storageKey = 'midi-controller-preset-v1';
function loadPreset() {
  try {
    return validatePreset(JSON.parse(localStorage.getItem(storageKey) ?? 'null'));
  } catch {
    return createPreset();
  }
}
export function usePreset(page: number, foot: number, gesture: number) {
  const [preset, setPreset] = useState(loadPreset);
  const [notice, setNotice] = useState('');
  const external = foot >= 6;
  const externals = preset.externals ?? createExternals();
  const action = external ? externals[foot - 6] : preset.pages[page][foot][gesture];
  function update(patch: Partial<MidiAction>) {
    const next = structuredClone(preset);
    if (external) {
      next.externals ??= createExternals();
      Object.assign(next.externals[foot - 6], patch);
      try {
        validateExternals(next.externals);
      } catch (error) {
        setNotice(errorMessage(error));
        return false;
      }
    } else Object.assign(next.pages[page][foot][gesture], patch);
    try {
      validatePreset(next);
    } catch (error) {
      setNotice(errorMessage(error));
      return false;
    }
    setPreset(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setNotice('Rascunho salvo neste navegador.');
    } catch {
      setNotice('Não foi possível salvar no navegador. Exporte seu preset.');
    }
    return true;
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 100000) throw Error('Arquivo muito grande.');
      const next = validatePreset(JSON.parse(await file.text()));
      next.externals ??= structuredClone(externals); // Old presets do not erase the global draft.
      validatePreset(next);
      setPreset(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
        setNotice('Preset importado e salvo neste navegador.');
      } catch {
        setNotice('Preset importado, mas sem persistência local.');
      }
    } catch (error) {
      setNotice(`Não foi possível importar: ${errorMessage(error)}`);
    }
    event.target.value = '';
  }
  function exportFile() {
    downloadFile(
      JSON.stringify(preset, null, 2),
      'midi-controller-preset.json',
      'application/json',
    );
  }
  function applyUsbPreset(next: Preset) {
    setPreset(next);
    try {
      localStorage.setItem(`${storageKey}-before-usb`, JSON.stringify(preset));
      localStorage.setItem(storageKey, JSON.stringify(next));
      setNotice('Configuração do Nano carregada no editor.');
    } catch {
      setNotice('Leitura aplicada, mas não foi possível salvar no navegador. Exporte o preset.');
    }
  }
  return { preset, externals, action, notice, update, importFile, exportFile, applyUsbPreset };
}
