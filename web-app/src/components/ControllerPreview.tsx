import { Fragment, type MouseEvent } from 'react';
import { externalNames } from '../domain/external-config';
import { types } from '../domain/preset';
import type { MidiAction, Preset } from '../domain/types';
import { t } from '../i18n';
import { ControllerPreviewRoot } from './ControllerPreview.styles';
import { Button } from './ui/Button';
import { Hint } from './ui/Typography';

interface Props {
  preset: Preset;
  externals: MidiAction[];
  page: number;
  foot: number;
  gesture: number;
  midi: number;
  expressionMode: number;
  setExpressionMode: (mode: number) => void;
  editorOpen: boolean;
  line1: string;
  line2: string;
  setPage: (page: number) => void;
  setMidi: (value: number) => void;
  selectFoot: (index: number, event: MouseEvent<HTMLButtonElement>) => void;
}
export function ControllerPreview({
  preset,
  externals,
  page,
  foot,
  gesture,
  midi,
  expressionMode,
  setExpressionMode,
  editorOpen,
  line1,
  line2,
  setPage,
  setMidi,
  selectFoot,
}: Props) {
  return (
    <ControllerPreviewRoot>
      <div className="toolbar">
        <nav className="tabs" aria-label={t('Páginas do controlador')}>
          {[0, 1].map((p) => (
            <Button
              key={p}
              aria-pressed={page === p}
              className={page === p ? 'selected' : ''}
              onClick={() => setPage(p)}
            >
              {' '}
              {t('Página')} {p + 1}
            </Button>
          ))}
        </nav>
        <Hint as="span" className="hint">
          {t(['Clique', 'Clique longo', 'Clique duplo'][gesture])}
        </Hint>
      </div>
      <section className="device" aria-label={t('Prévia do controlador')}>
        {[
          { id: 'upper', foots: [0, 2, 4] },
          { id: 'lower', foots: [1, 3, 5] },
        ].map((row) => (
          <Fragment key={row.id}>
            {row.id === 'lower' && (
              <div className="lcd" role="img" aria-label={`LCD: ${line1}, ${line2}`}>
                <pre>
                  {line1}
                  {'\n'}
                  {line2}
                </pre>
              </div>
            )}
            <div className="foots">
              {row.foots.map((f) => (
                <Button
                  key={f}
                  className={`foot ${editorOpen && foot === f ? 'chosen' : ''}`}
                  aria-pressed={editorOpen && foot === f}
                  onClick={(event) => selectFoot(f, event)}
                >
                  <span className="led" />
                  <strong>FS {f + 1}</strong>
                  <span className="switch" />
                  <small>
                    {preset.pages[page][f][gesture].label ||
                      types[preset.pages[page][f][gesture].type]}
                  </small>
                </Button>
              ))}
            </div>
          </Fragment>
        ))}
      </section>
      <div className="external-heading">
        <h3>{t('Foots Externos')}</h3>
      </div>
      <div className="foots external-foots">
        {externalNames.map((name, i) => (
          <Button
            key={t(name)}
            className={`foot ${editorOpen && foot === i + 6 ? 'chosen' : ''}`}
            aria-pressed={editorOpen && foot === i + 6}
            onClick={(event) => selectFoot(i + 6, event)}
          >
            <strong>FS {i + 7}</strong>
            <span className="switch" />
            <small>{t(name)}</small>
            <small>
              {externals[i * 3 + gesture].label || types[externals[i * 3 + gesture].type]}
            </small>
          </Button>
        ))}
      </div>
      <details className="expression-tools">
        <summary>{t('Simular pedal de expressão')}</summary>
        <label className="simulation">
          {' '}
          {t('Simular expressão')}{' '}
          <strong>
            {midi} MIDI · {Math.round((midi * 100) / 127)}%
          </strong>
          <input
            type="range"
            min="0"
            max="127"
            value={midi}
            onChange={(e) => setMidi(Number(e.target.value))}
          />
        </label>
        <label>
          {' '}
          {t('Modo de expressão na prévia')}{' '}
          <select
            value={expressionMode}
            disabled={!expressionMode}
            onChange={(e) => setExpressionMode(Number(e.target.value))}
          >
            {!expressionMode && <option value={0}>{t('CC configurado no Nano')}</option>}
            <option value={1}>EXP · CC1</option>
            <option value={2}>EXP2 · CC2</option>
          </select>
        </label>
        <Hint className="hint">
          {' '}
          {t('A prévia é uma simulação. Nenhum comando é enviado ao Controlador.')}{' '}
        </Hint>
      </details>
      <p className="canvas-tip">
        {editorOpen
          ? t('Selecione outro foot para continuar editando.')
          : t('Selecione um foot para configurar seu comando.')}
      </p>
    </ControllerPreviewRoot>
  );
}
