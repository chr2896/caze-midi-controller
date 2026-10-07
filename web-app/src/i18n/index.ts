import { useSyncExternalStore } from 'react';
import english from './en.json';
export type Language = 'pt-BR' | 'en';
let language: Language = 'pt-BR';
try {
  if (localStorage.getItem('caze-language') === 'en') language = 'en';
} catch {
  /* Storage is optional. */
}
const listeners = new Set<() => void>();
const dictionary: Record<string, string> = english;
export function setLanguage(next: Language) {
  language = next;
  try {
    localStorage.setItem('caze-language', next);
  } catch {
    /* Keep selection for this session. */
  }
  if (typeof document !== 'undefined') document.documentElement.lang = next;
  for (const listener of listeners) listener();
}
export function useLanguage() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => language,
    () => 'pt-BR' as Language,
  );
}
export function t(text: string): string {
  if (language === 'pt-BR') return text;
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (dictionary[normalized]) return dictionary[normalized];
  const progress = normalized.match(/^Gravando (\d+)% — mantenha a USB conectada\.$/);
  if (progress) return `Writing ${progress[1]}% — keep USB connected.`;
  for (const [source, target] of [
    ['Não foi possível concluir: ', 'Could not complete: '],
    ['Não foi possível importar: ', 'Could not import: '],
    ['Configurações do FS ', 'FS settings '],
  ] as const) {
    if (text.startsWith(source)) return target + t(text.slice(source.length));
  }
  return text;
}
if (typeof document !== 'undefined') document.documentElement.lang = language;
