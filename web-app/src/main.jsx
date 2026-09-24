import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPreset, validatePreset, commandText, types } from './preset.js';
import './style.css';
import UsbReader from './UsbReader.jsx';

const storageKey = 'midi-controller-preset-v1';
function loadPreset() { try { return validatePreset(JSON.parse(localStorage.getItem(storageKey))); } catch { return createPreset(); } }
function App() {
  const [preset, setPreset] = useState(loadPreset);
  const [page, setPage] = useState(0), [foot, setFoot] = useState(0), [gesture, setGesture] = useState(0);
  const [midi, setMidi] = useState(64), [activeSlot, setActiveSlot] = useState(2), [notice, setNotice] = useState('');
  const action = preset.pages[page][foot][gesture];
  function update(patch) {
    const next = structuredClone(preset);
    Object.assign(next.pages[page][foot][gesture], patch);
    setPreset(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setNotice('Rascunho salvo neste navegador.'); }
    catch { setNotice('Não foi possível salvar no navegador. Exporte seu preset.'); }
  }
  async function importFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 100000) throw Error('Arquivo muito grande.');
      const next = validatePreset(JSON.parse(await file.text()));
      setPreset(next);
      try { localStorage.setItem(storageKey, JSON.stringify(next)); setNotice('Preset importado e salvo neste navegador.'); }
      catch { setNotice('Preset importado, mas sem persistência local.'); }
    } catch (error) { setNotice(`Não foi possível importar: ${error.message}`); }
    event.target.value = '';
  }
  function exportFile() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'midi-controller-preset.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function number(label, key, max = 127, min = 0) {
    return <label>{label}<input type="number" min={min} max={max} value={action[key]} onChange={e => {
      const value = Number(e.target.value); if (Number.isInteger(value) && value >= min && value <= max) update({ [key]: value });
    }}/></label>;
  }
  const header = action.label || `${['', 'LNG ', 'DBL '][gesture]}FS ${foot + 1}`;
  const line1 = action.label ? header.padEnd(13) + 'EXP' : header.padEnd(9) + `P${page + 1}  EXP`;
  const line2 = commandText(action, action[`value${activeSlot}`]).slice(0, 12).padEnd(12) + `${Math.round(midi * 100 / 127)}%`.padStart(4);
  return <main>
    <header><div className="brand"><span className="logo">M</span><div>CAZE MIDI CTRL<small>CONTROLLER EDITOR</small></div></div><span className="badge">● Editor local</span></header>
    <section className="intro"><p className="eyebrow">SEU SETUP, DO SEU JEITO</p><h1>Cada toque.<br/><span>Uma possibilidade.</span></h1><p>Organize seus comandos e experimente os labels do seu controlador.</p></section>
    <UsbReader preset={preset} onLoad={next => {
      setPreset(next);
      try {
        localStorage.setItem(`${storageKey}-before-usb`, JSON.stringify(preset));
        localStorage.setItem(storageKey, JSON.stringify(next));
        setNotice('Leitura aplicada ao rascunho. Labels preservados.');
      } catch { setNotice('Leitura aplicada, mas não foi possível salvar no navegador. Exporte o preset.'); }
    }}/>
    <div className="toolbar"><div className="tabs">{[0, 1, 2].map(p => <button key={p} aria-pressed={page === p} className={page === p ? 'selected' : ''} onClick={() => setPage(p)}>Página {p + 1}</button>)}</div><div className="files"><label className="button">Importar<input type="file" accept=".json,application/json" onChange={importFile}/></label><button onClick={exportFile}>Exportar preset ↗</button></div></div>
    <div className="workspace"><section className="panel device"><div className="section-title"><h2>Seu controlador</h2><span>PRÉVIA · 16 × 2</span></div><div className="lcd" role="img" aria-label={`LCD: ${line1}, ${line2}`}><pre>{line1}{'\n'}{line2}</pre></div>
      <div className="foots">{[0, 2, 4, 1, 3, 5].map(f => <button key={f} className={`foot ${foot === f ? 'chosen' : ''}`} aria-pressed={foot === f} onClick={() => { setFoot(f); setActiveSlot(2); }}><span className="led"/><strong>FS {f + 1}</strong><span className="switch"/><small>{preset.pages[page][f][gesture].label || types[preset.pages[page][f][gesture].type]}</small></button>)}</div>
      <label className="simulation">Simular expressão <strong>{midi} MIDI · {Math.round(midi * 100 / 127)}%</strong><input type="range" min="0" max="127" value={midi} onChange={e => setMidi(Number(e.target.value))}/></label>
      <p className="hint">A prévia é uma simulação. Nenhum comando é enviado ao Nano.</p>
    </section><section className="panel settings"><div className="section-title"><h2>Footswitch {foot + 1}</h2><span>PÁGINA {page + 1}</span></div>
      <div className="gestures">{['Clique', 'Longo', 'Duplo'].map((name, g) => <button key={name} aria-pressed={gesture === g} className={gesture === g ? 'selected' : ''} onClick={() => setGesture(g)}>{name}</button>)}</div>
      <label>Label do LCD <input placeholder={`FS ${foot + 1}`} maxLength={12} value={action.label} onChange={e => update({ label: e.target.value.replace(/[^\x20-\x7E]/g, '') })}/><small>{action.label.length}/12 · Caracteres sem acentos</small></label>
      <label>Tipo de comando<select value={action.type} onChange={e => update({ type: Number(e.target.value), ...([6, 7].includes(Number(e.target.value)) ? { value1: 0 } : {}) })}>{types.map((name, i) => <option key={name} value={i}>{name}</option>)}</select></label>
      {[1, 2, 3].includes(action.type) && <div className="fields">{number('Canal MIDI', 'channel', 16, 1)}{number(action.type === 1 ? 'Programa' : 'Número do CC', 'value1')}{action.type !== 1 && number('Valor 1', 'value2')}{action.type === 3 && number('Valor 2', 'value3')}</div>}
      {[6, 7].includes(action.type) && <label>Página de destino<select value={action.value1} onChange={e => update({ value1: Number(e.target.value) })}>{[0, 1, 2].map(p => <option key={p} value={p}>Página {p + 1}</option>)}</select></label>}
      {action.type === 3 && <>
        <label className="checkbox-label"><span><input type="checkbox" checked={action.toggleOnOff === true} onChange={e => update({ toggleOnOff: e.target.checked })}/>Exibir valores personalizados como ON/OFF</span><small>Menor valor = OFF; maior = ON. Valores iguais mantêm a exibição original. Não altera os valores MIDI.</small></label>
        <button className="toggle-preview" onClick={() => setActiveSlot(activeSlot === 2 ? 3 : 2)}>Alternar valor ativo na prévia</button>
      </>}
      <div className="integration"><strong>Gravação no Nano — próxima etapa</strong><p>A conexão USB permite apenas leitura. Edições, labels e a opção ON/OFF continuam locais até implementarmos a gravação no firmware.</p></div>
    </section></div><p className="notice" role="status">{notice}</p><footer>ARDUINO NANO · 6 FOOTSWITCHES · 3 PÁGINAS<span>React + JavaScript</span></footer>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
