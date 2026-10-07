import type { RefObject } from 'react';
import { externalNames, externalTextUsage, TEXT_BUDGET } from '../domain/external-config';
import { INTERNAL_TEXT_BUDGET } from '../domain/internal-text';
import { isTapTempo, types } from '../domain/preset';
import type { ActiveSlot, MidiAction, NumericActionKey } from '../domain/types';
import { FootEditorRoot } from './FootEditor.styles';
import { QuadLibrary } from './QuadLibrary';
import { Button } from './ui/Button';
import { Eyebrow, Hint } from './ui/Typography';

interface Props {
  action: MidiAction;
  externals: MidiAction[];
  textUsage: number;
  foot: number;
  page: number;
  gesture: number;
  activeSlot: ActiveSlot;
  setActiveSlot: (slot: ActiveSlot) => void;
  setGesture: (gesture: number) => void;
  update: (patch: Partial<MidiAction>) => boolean;
  closeEditor: () => void;
  onOpenUsb: () => void;
  editorHeading: RefObject<HTMLHeadingElement | null>;
}
export function FootEditor({
  action,
  externals,
  textUsage,
  foot,
  page,
  gesture,
  activeSlot,
  setActiveSlot,
  setGesture,
  update,
  closeEditor,
  onOpenUsb,
  editorHeading,
}: Props) {
  const external = foot >= 6;
  const tap = external
    ? action.tapTempo === true && [2, 3].includes(action.type)
    : isTapTempo(action);
  function number(label: string, key: NumericActionKey, max = 127, min = 0) {
    return (
      <label>
        {label}
        <input
          type="number"
          min={min}
          max={max}
          value={action[key]}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (Number.isInteger(value) && value >= min && value <= max) update({ [key]: value });
          }}
        />
      </label>
    );
  }
  return (
    <FootEditorRoot aria-label={`Configurações do FS ${foot + 1}`}>
      <div className="inspector-top">
        <Eyebrow>{external ? 'FOOT EXTERNO · GLOBAL' : `PÁGINA ${page + 1}`}</Eyebrow>
        <Button aria-label="Fechar editor" onClick={closeEditor}>
          ×
        </Button>
      </div>
      <h2 ref={editorHeading} tabIndex={-1}>
        FS {foot + 1}
        <span>{external ? externalNames[foot - 6] : 'Configurar footswitch'}</span>
      </h2>
      {external ? (
        <Hint className="hint">
          Clique simples · Todas as páginas
          <br />
          Textos: {externalTextUsage(externals)}/{TEXT_BUDGET} caracteres compartilhados.
        </Hint>
      ) : (
        <div className="gestures">
          {['Clique', 'Longo', 'Duplo'].map((name, g) => (
            <Button
              key={name}
              aria-pressed={gesture === g}
              className={gesture === g ? 'selected' : ''}
              onClick={() => setGesture(g)}
            >
              {name}
            </Button>
          ))}
        </div>
      )}
      <label>
        Nome no display{' '}
        <input
          placeholder={`FS ${foot + 1}`}
          maxLength={12}
          value={action.label}
          onChange={(e) => update({ label: e.target.value.replace(/[^\x20-\x7E]/g, '') })}
        />
        <small>{action.label.length}/12 · Caracteres sem acentos</small>
      </label>
      <label>
        Tipo de comando
        <select
          value={action.type}
          onChange={(e) =>
            update({
              type: Number(e.target.value),
              ...([6, 7].includes(Number(e.target.value)) ? { value1: 0 } : {}),
            })
          }
        >
          {types.map((name, i) => (
            <option key={name} value={i}>
              {name}
            </option>
          ))}
        </select>
      </label>
      {tap && (
        <Hint className="hint">
          O Nano calcula BPM pelas pisadas. A prévia aguarda o tap físico; não recebe o BPM da
          pedaleira.
        </Hint>
      )}
      {[1, 2, 3].includes(action.type) && (
        <div className="fields">
          {number('Canal MIDI', 'channel', 16, 1)}
          {number(action.type === 1 ? 'Programa' : 'Número do CC', 'value1')}
          {action.type !== 1 && number('Valor 1', 'value2')}
          {action.type === 3 && number('Valor 2', 'value3')}
        </div>
      )}
      {[6, 7].includes(action.type) && (
        <label>
          Página de destino
          <select
            value={action.value1}
            onChange={(e) => update({ value1: Number(e.target.value) })}
          >
            {[0, 1, 2].map((p) => (
              <option key={p} value={p}>
                Página {p + 1}
              </option>
            ))}
          </select>
        </label>
      )}
      {action.type === 3 && (
        <>
          <div className="fields">
            {(['state1', 'state2'] as const).map((key, i) => (
              <label key={key}>
                Texto do valor {i + 1} ({action[i === 0 ? 'value2' : 'value3']})
                <input
                  maxLength={10}
                  placeholder={i === 0 ? 'PRESET' : 'STOMP'}
                  value={action[key] || ''}
                  onChange={(e) => update({ [key]: e.target.value.replace(/[^\x20-\x7E]/g, '') })}
                />
                <small>{(action[key] || '').length}/10 · Opcional</small>
              </label>
            ))}
          </div>
          <Hint className="hint">
            O LCD mostra apenas o estado enviado, entre parênteses. Texto vazio usa o valor ou
            OFF/ON. O primeiro clique envia Valor 1; reiniciar ou salvar reinicia a alternância.
          </Hint>
          <Button
            className="toggle-preview"
            onClick={() => setActiveSlot(activeSlot === 2 ? 3 : 2)}
          >
            Alternar valor ativo na prévia
          </Button>
        </>
      )}
      {!external && (
        <Hint>
          Textos dos foots 1–6: {textUsage}/{INTERNAL_TEXT_BUDGET} caracteres compartilhados entre
          nomes e estados, nas três páginas e gestos.
        </Hint>
      )}
      <QuadLibrary update={update} onApplied={() => setActiveSlot(2)} />
      <p className="editor-note">
        Edições salvas no navegador. Para enviar ao Nano, abra{' '}
        <Button className="text-button" onClick={onOpenUsb}>
          Ler / salvar no pedal
        </Button>
        .
      </p>
    </FootEditorRoot>
  );
}
