import type { RefObject } from 'react';
import { externalNames } from '../domain/external-config';
import { INTERNAL_TEXT_BUDGET } from '../domain/internal-text';
import { isTapTempo, types } from '../domain/preset';
import type { ActiveSlot, MidiAction, NumericActionKey } from '../domain/types';
import { t } from '../i18n';
import { FootEditorRoot } from './FootEditor.styles';
import { QuadLibrary } from './QuadLibrary';
import { Button } from './ui/Button';
import { Eyebrow, Hint } from './ui/Typography';

interface Props {
  action: MidiAction;
  textUsage: number;
  foot: number;
  page: number;
  gesture: number;
  activeSlot: ActiveSlot;
  setActiveSlot: (slot: ActiveSlot) => void;
  onToggleExpressionPreview: () => void;
  setGesture: (gesture: number) => void;
  update: (patch: Partial<MidiAction>) => boolean;
  onResetFoot: () => void;
  closeEditor: () => void;
  onOpenUsb: () => void;
  editorHeading: RefObject<HTMLHeadingElement | null>;
}
export function FootEditor({
  action,
  textUsage,
  foot,
  page,
  gesture,
  activeSlot,
  setActiveSlot,
  onToggleExpressionPreview,
  setGesture,
  update,
  closeEditor,
  onResetFoot,
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
        {t(label)}
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
    <FootEditorRoot aria-label={t(`Configurações do FS ${foot + 1}`)}>
      <div className="inspector-top">
        <Eyebrow>{external ? t('FOOT EXTERNO · GLOBAL') : `${t('PÁGINA')} ${page + 1}`}</Eyebrow>
        <Button aria-label={t('Fechar editor')} onClick={closeEditor}>
          ×
        </Button>
      </div>
      <h2 ref={editorHeading} tabIndex={-1}>
        FS {foot + 1}
        <span>{external ? t(externalNames[foot - 6]) : t('Configurar footswitch')}</span>
      </h2>
      {external && (
        <Hint>
          {' '}
          {t(
            'Global · Todas as páginas. Longo: 1 s; duplo: intervalo de até 250 ms. Com gestos extras, o clique simples aguarda a definição do gesto.',
          )}{' '}
        </Hint>
      )}
      {
        <div className="gestures">
          {['Clique', 'Longo', 'Duplo'].map((name, g) => (
            <Button
              key={t(name)}
              aria-pressed={gesture === g}
              className={gesture === g ? 'selected' : ''}
              onClick={() => setGesture(g)}
            >
              {t(name)}
            </Button>
          ))}
        </div>
      }
      <label>
        {' '}
        {t('Nome no display')}{' '}
        <input
          placeholder={`FS ${foot + 1}`}
          maxLength={12}
          value={action.label}
          onChange={(e) => update({ label: e.target.value.replace(/[^\x20-\x7E]/g, '') })}
        />
        <small>
          {action.label.length}
          {t('/12 · Caracteres sem acentos')}
        </small>
      </label>
      <label>
        {' '}
        {t('Tipo de comando')}{' '}
        <select
          value={action.type === 9 ? 3 : action.type}
          onChange={(e) =>
            update({
              type: Number(e.target.value),
              ...(Number(e.target.value) === 0 ? { label: '' } : {}),
              ...([6, 7].includes(Number(e.target.value)) ? { value1: 0 } : {}),
            })
          }
        >
          {types.slice(0, 9).map((name, i) => (
            <option key={t(name)} value={i}>
              {t(name)}
            </option>
          ))}
        </select>
      </label>
      {(action.type === 9 || (action.type === 3 && action.value1 === 64)) && (
        <label>
          <input
            type="checkbox"
            checked={action.type === 9}
            onChange={(e) =>
              update({
                type: e.target.checked ? 9 : 3,
                value1: 64,
                value2: 0,
                value3: 127,
                tapTempo: false,
              })
            }
          />{' '}
          {t('Sincronizar páginas do controlador e da Quad Cortex')}{' '}
        </label>
      )}
      {action.type === 8 && (
        <Hint>
          {' '}
          {t(
            'Alterna o pedal conectado ao controlador entre CC1 (EXP) e CC2 (EXP2), usando o canal, calibração e limites do menu de expressão. Inicia em EXP. Atribua volume e wah/whammy na Quad; este comando não liga/desliga o bloco automaticamente.',
          )}{' '}
        </Hint>
      )}
      {action.type === 8 && (
        <Button className="toggle-preview" onClick={onToggleExpressionPreview}>
          {' '}
          {t('Alternar valor ativo na prévia')}{' '}
        </Button>
      )}
      {action.type === 9 && (
        <>
          <Hint>
            {' '}
            {t(
              'Alterna a página do controlador e envia CC64: I/P1 = 0, II/P2 = 127. Usa a página atual como referência, inclusive após outras trocas locais.',
            )}{' '}
          </Hint>
          {number(t('Canal MIDI'), 'channel', 16, 1)}
        </>
      )}
      {tap && (
        <Hint className="hint">
          {' '}
          {t(
            'O Nano calcula BPM pelas pisadas. A prévia aguarda o tap físico; não recebe o BPM da pedaleira.',
          )}{' '}
        </Hint>
      )}
      {[1, 2, 3].includes(action.type) && (
        <div className="fields">
          {number(t('Canal MIDI'), 'channel', 16, 1)}
          {number(action.type === 1 ? t('Programa') : t('Número do CC'), 'value1')}
          {action.type !== 1 && number(t('Valor 1'), 'value2')}
          {action.type === 3 && number(t('Valor 2'), 'value3')}
        </div>
      )}
      {[6, 7].includes(action.type) && (
        <label>
          {' '}
          {t('Página de destino')}{' '}
          <select
            value={action.value1}
            onChange={(e) => update({ value1: Number(e.target.value) })}
          >
            {[0, 1].map((p) => (
              <option key={p} value={p}>
                {' '}
                {t('Página')} {p + 1}
              </option>
            ))}
          </select>
        </label>
      )}
      {[3, 9].includes(action.type) && (
        <>
          <div className="fields">
            {(['state1', 'state2'] as const).map((key, i) => (
              <label key={key}>
                {' '}
                {t('Texto do valor')} {i + 1} ({action[i === 0 ? 'value2' : 'value3']})
                <input
                  maxLength={10}
                  placeholder={i === 0 ? 'PRESET' : 'STOMP'}
                  value={action[key] || ''}
                  onChange={(e) => update({ [key]: e.target.value.replace(/[^\x20-\x7E]/g, '') })}
                />
                <small>
                  {(action[key] || '').length}
                  {t('/10 · Opcional')}
                </small>
              </label>
            ))}
          </div>
          <Hint className="hint">
            {action.type === 9
              ? t(
                  'Os textos representam I/P1 (0) e II/P2 (127). A próxima pisada alterna a partir da página atual.',
                )
              : t(
                  'O LCD mostra apenas o estado enviado, entre parênteses. Texto vazio usa o valor ou OFF/ON. O primeiro clique envia Valor 1; reiniciar ou salvar reinicia a alternância.',
                )}
          </Hint>
          {action.type === 3 && (
            <Button
              className="toggle-preview"
              onClick={() => setActiveSlot(activeSlot === 2 ? 3 : 2)}
            >
              {' '}
              {t('Alternar valor ativo na prévia')}{' '}
            </Button>
          )}
        </>
      )}
      {
        <Hint>
          {' '}
          {t('Textos de todos os foots:')} {textUsage}/{INTERNAL_TEXT_BUDGET}{' '}
          {t(
            'caracteres compartilhados entre nomes e estados, nas duas páginas internas e nos nove gestos externos.',
          )}{' '}
        </Hint>
      }
      <div className="foot-actions">
        <Button
          onClick={onResetFoot}
          title={t(
            'Limpa clique, longo e duplo deste foot na página atual. Foots externos são globais.',
          )}
        >
          {t('Restaurar foot')}
        </Button>
        <QuadLibrary update={update} onApplied={() => setActiveSlot(2)} />
      </div>
      <p className="editor-note">
        {' '}
        {t('Edições salvas no navegador. Para enviar ao Nano, abra')}{' '}
        <Button className="text-button" onClick={onOpenUsb}>
          {' '}
          {t('Ler / salvar no pedal')}{' '}
        </Button>
        .
      </p>
    </FootEditorRoot>
  );
}
