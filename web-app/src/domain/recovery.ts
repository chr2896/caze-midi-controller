import { validatePreset } from './preset';
import { buildImage, validateSnapshot } from './storage-layout';
import type { RecoveryBundle } from './types';
import { isRecord } from './validation';
export function parseRecovery(data: unknown): RecoveryBundle {
  if (!isRecord(data) || data.version !== 2) throw Error('Formato de recuperação inválido.');
  const preset = validatePreset(data.preset);
  const before = validateSnapshot(data.before);
  const includeExternals = data.includeExternals === true;
  buildImage(preset, before, includeExternals);
  return {
    version: 2,
    preset,
    before,
    includeExternals,
    created: typeof data.created === 'string' ? data.created : undefined,
  };
}
