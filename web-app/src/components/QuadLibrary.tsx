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
          <select id={id} value={value} onChange={(e) => change(Number(e.target.value))}>
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
            {command.options && (
              <label>
                Comportamento
                <select
                  value={toggle ? 'toggle' : 'single'}
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
                    : toggle
                      ? 'Primeira pisada'
                      : 'Valor enviado',
                  first,
                  setFirst,
                )}
                {toggle && command.options && valueField('Segunda pisada', second, setSecond)}
              </div>
            )}
            <p>
              Aplica ao foot e gesto selecionados, mantendo o canal MIDI. Os textos poderão ser
              editados depois. A Quad não devolve o estado para este editor.
            </p>
            {error && <p role="alert">{error}</p>}
            <Button
              onClick={() => {
                if (update(quadPatch(command, first, toggle ? second : undefined))) {
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
