import assert from 'node:assert/strict';
import { test } from 'node:test';
import { quadCommands } from '../domain/quad-library';
import { setLanguage, t } from '../i18n';

test('language switching translates UI and progress without changing MIDI library data', () => {
  const before = JSON.stringify(quadCommands);
  setLanguage('en');
  assert.equal(t('Conectar controlador'), 'Connect controller');
  assert.equal(t('Gravando 50% — mantenha a USB conectada.'), 'Writing 50% — keep USB connected.');
  for (const command of quadCommands) {
    assert.ok(
      !/[ãç]|seleciona|Envia|Carrega|Define|pisada/.test(t(command.description)),
      command.id,
    );
  }
  assert.equal(JSON.stringify(quadCommands), before);
  setLanguage('pt-BR');
  assert.equal(t('Conectar controlador'), 'Conectar controlador');
});
