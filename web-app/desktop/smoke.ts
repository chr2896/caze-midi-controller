import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { app } from 'electron';

app.disableHardwareAcceleration();
app.setPath('userData', mkdtempSync(path.join(tmpdir(), 'caze-desktop-test-')));
const timer = setTimeout(() => {
  console.error('Desktop startup timed out');
  app.exit(1);
}, 20000);
app.on('browser-window-created', (_event, win) => {
  win.webContents.once('did-finish-load', async () => {
    try {
      const result = await win.webContents.executeJavaScript(`new Promise(resolve => {
        const check = () => {
          if (!document.querySelector('button')) return setTimeout(check, 50);
          document.fonts.ready.then(() => resolve({title: document.title, text: document.body.innerText, serial: 'serial' in navigator, node: typeof window.require, protocol: location.protocol}));
        }; check();
      })`);
      if (
        !result.text.includes('CAZE MIDI CTRL') ||
        !result.serial ||
        result.node !== 'undefined' ||
        result.protocol !== 'file:'
      )
        throw new Error(JSON.stringify(result));
      await new Promise((resolve) => setTimeout(resolve, 500));
      const screenshot = await win.webContents.capturePage();
      writeFileSync(path.resolve('release/desktop-smoke.png'), screenshot.toPNG());
      const flow = await win.webContents.executeJavaScript(`(async () => {
        const pause = () => new Promise(r => setTimeout(r, 100));
        const button = (text) => [...document.querySelectorAll('button')].find(b => b.textContent.includes(text));
        if (!button('Conectar controlador') || !button('Entrar no modo demo')) throw Error('Welcome actions missing');
        document.querySelector('summary').click(); await pause();
        button('English').click(); await pause();
        if (document.documentElement.lang !== 'en' || !button('Connect controller')) throw Error('English welcome missing');
        if (!document.body.innerText.includes('Enable USB MODE')) throw Error('English connection hint missing');
        button('Enter demo mode').click(); await pause();
        if (!document.body.innerText.includes('Demo mode')) throw Error('Demo did not open');
        const foot = [...document.querySelectorAll('button')].find(b => /FS\\s*1/.test(b.textContent));
        if (!foot) throw Error('Foot missing');
        foot.click(); await pause();
        const input = document.querySelector('input[placeholder="FS 1"]');
        if (!input) throw Error('Label editor missing');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'TESTE');
        input.dispatchEvent(new Event('input', {bubbles: true})); await pause();
        if (!document.body.innerText.includes('Changes not sent to the controller')) throw Error('Dirty indicator missing');
        const draft = localStorage.getItem('midi-controller-preset-v1');
        document.querySelector('header summary').click(); await pause();
        button('Português-BR').click(); await pause();
        if (document.documentElement.lang !== 'pt-BR' || !document.body.innerText.includes('Alterações não enviadas ao controlador')) throw Error('Portuguese switch missing');
        if (localStorage.getItem('midi-controller-preset-v1') !== draft || input.value !== 'TESTE') throw Error('Language changed preset');
        if (localStorage.getItem('caze-language') !== 'pt-BR') throw Error('Language not persisted');
        const inspector = document.querySelector('[aria-label="Configurações do FS 1"]');
        const select = inspector.querySelector('select');
        const choose = async(value) => { select.value = value; select.dispatchEvent(new Event('change', {bubbles:true})); await pause(); };
        await choose('3'); await choose('0');
        if (input.value !== '') throw Error('EMPTY did not clear label');
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'RESET');
        input.dispatchEvent(new Event('input', {bubbles:true})); await pause();
        const beforeReset = JSON.parse(localStorage.getItem('midi-controller-preset-v1'));
        button('Restaurar foot').click(); await pause();
        const afterReset = JSON.parse(localStorage.getItem('midi-controller-preset-v1'));
        const defaults = {type:0,channel:1,value1:0,value2:0,value3:127,label:'',toggleOnOff:false};
        if (afterReset.pages[0][0].some(a => JSON.stringify(a) !== JSON.stringify(defaults))) throw Error('Foot not reset');
        beforeReset.pages[0][0] = afterReset.pages[0][0];
        if (JSON.stringify(beforeReset) !== JSON.stringify(afterReset)) throw Error('Reset affected another foot or page');
        return true;
      })()`);
      if (!flow) throw Error('Demo flow failed');
      console.log(
        'PASS: welcome, demo editing, pending changes, local React, Web Serial and Node isolation.',
      );
      clearTimeout(timer);
      app.exit(0);
    } catch (error) {
      console.error(error);
      clearTimeout(timer);
      app.exit(1);
    }
  });
});
await import('./main.js');
