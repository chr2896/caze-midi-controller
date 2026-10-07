import { useRef, useState } from 'react';
import { QUAD_MANUAL, quadCommands, quadPatch } from '../domain/quad-library';
import type { MidiAction } from '../domain/types';
import { Modal } from './Modal';
import { QuadLibraryRoot } from './QuadLibrary.styles';
import { Button } from './ui/Button';
export function QuadLibrary({
  update,
  onApplied,
}: {
  update: (patch: Partial<MidiAction>) => boolean;
  onApplied: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const [selected, setSelected] = useState('cc47');
  const [first, setFirst] = useState(0);
  const [second, setSecond] = useState(2);
  const [toggle, setToggle] = useState(true);
  const [error, setError] = useState('');
  const [syncPages, setSyncPages] = useState(false);
  const command = quadCommands.find((c) => c.id === selected) ?? quadCommands[0];
  const matches = quadCommands.filter(
    (c) =>
      (category === 'Todas' || c.category === category) &&
      `${c.name} ${c.id} ${c.category}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase().trim()),
  );
  function valueField(label: string, value: number, change: (value: number) => void) {
    const id = `quad-value-${label.replace(/[^a-zA-Z0-9]/g, '-')}`;
    return (
      <label htmlFor={id}>
        {label}
        {command.options ? (
          <select
            id={id}
            value={value}
            disabled={syncPages}
            onChange={(e) => change(Number(e.target.value))}
          >
            {command.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.name} · {o.value}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            type="number"
            min={0}
            max={127}
            value={value}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isInteger(n) && n >= 0 && n <= 127) change(n);
            }}
          />
        )}
      </label>
    );
  }
  return (
    <>
      <Button onClick={() => dialog.current?.showModal()}>
        Biblioteca MIDI · Quad Cortex mini
      </Button>
      <Modal
        dialogRef={dialog}
        id="quad-library-title"
        title="Biblioteca MIDI · Quad Cortex mini"
        closeLabel="Fechar biblioteca"
      >
        <QuadLibraryRoot>
          <p>
            Todos os {quadCommands.length} comandos CC/PC da tabela MIDI da mini · CorOS 4.1.1.{' '}
            <a href={QUAD_MANUAL} target="_blank" rel="noreferrer">
              Manual oficial ↗
            </a>
          </p>
          <div className="library-filters">
            <label>
              Buscar comando
              <input
                type="search"
                placeholder="Nome ou CC (ex.: CC64)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label>
              Categoria
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {['Todas', ...new Set(quadCommands.map((c) => c.category))].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <fieldset className="library-list">
            <legend>Comandos disponíveis</legend>
            {matches.map((c) => (
              <Button
                key={c.id}
                aria-pressed={selected === c.id}
                onClick={() => {
                  setSelected(c.id);
                  setSyncPages(false);
                  setFirst(c.options?.[0].value ?? 0);
                  setSecond(c.options?.at(-1)?.value ?? 127);
                  setToggle(false);
                  setError('');
                }}
              >
                <span>{c.name}</span>
                <small>{c.cc === undefined ? 'PC' : `CC${c.cc}`}</small>
              </Button>
            ))}
            {matches.length === 0 && <p>Nenhum comando encontrado.</p>}
          </fieldset>
          <section className="library-detail" aria-label="Configurar comando selecionado">
            <h3>
              {command.name} <small>{command.cc === undefined ? 'PC' : `CC${command.cc}`}</small>
            </h3>
            <p>{command.description}</p>
            {command.cc === 64 && (
              <label>
                <input
                  type="checkbox"
                  checked={syncPages}
                  onChange={(e) => setSyncPages(e.target.checked)}
                />
                Sincronizar páginas do controlador e da Quad Cortex
              </label>
            )}
            {command.options && (
              <label>
                Comportamento
                <select
                  value={syncPages || toggle ? 'toggle' : 'single'}
                  disabled={syncPages}
                  onChange={(e) => setToggle(e.target.value === 'toggle')}
                >
                  <option value="single">Enviar um valor</option>
                  <option value="toggle">Alternar dois valores</option>
                </select>
              </label>
            )}
            {!command.trigger && (
              <div className="library-values">
                {valueField(
                  command.cc === undefined
                    ? 'Programa (0–127)'
                    : syncPages
                      ? 'Página 1 do controlador'
                      : toggle
                        ? 'Primeira pisada'
                        : 'Valor enviado',
                  syncPages ? 0 : first,
                  setFirst,
                )}
                {(syncPages || toggle) &&
                  command.options &&
                  valueField(
                    syncPages ? 'Página 2 do controlador' : 'Segunda pisada',
                    syncPages ? 127 : second,
                    setSecond,
                  )}
              </div>
            )}
            {syncPages && (
              <p>
                A sincronização usa CC64 com valores fixos: 0 para I/P1 e 127 para II/P2. Cada
                pisada alterna as duas páginas a partir da página atual do controlador. Desmarque a
                opção para editar os valores livremente.
              </p>
            )}
            <p>
              Aplica ao foot e gesto selecionados, mantendo o canal MIDI. Os textos poderão ser
              editados depois. A Quad não devolve o estado para este editor.
            </p>
            {error && <p role="alert">{error}</p>}
            <Button
              onClick={() => {
                if (
                  update(
                    syncPages && command.cc === 64
                      ? {
                          type: 9,
                          value1: 64,
                          value2: 0,
                          value3: 127,
                          label: 'PAGINA QUAD',
                          state1: '',
                          state2: '',
                          tapTempo: false,
                        }
                      : quadPatch(command, first, toggle ? second : undefined),
                  )
                ) {
                  onApplied();
                  dialog.current?.close();
                } else
                  setError(
                    'Não foi possível aplicar. Confira o limite de textos compartilhados no editor.',
                  );
              }}
            >
              Usar neste foot
            </Button>
          </section>
        </QuadLibraryRoot>
      </Modal>
    </>
  );
}
