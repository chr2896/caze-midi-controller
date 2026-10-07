import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { app, BrowserWindow, dialog, shell } from 'electron';

const entry = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/index.html');
const entryUrl = pathToFileURL(entry).href;
let window: BrowserWindow | null = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 900,
    minHeight: 650,
    title: 'CAZE MIDI CTRL',
    backgroundColor: '#101519',
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  window = win;
  win.setMenuBarVisibility(false);
  const trusted = (url: string) => url === entryUrl;
  const ses = win.webContents.session;
  ses.setPermissionCheckHandler(
    (contents, permission) =>
      contents === win.webContents && trusted(contents.getURL()) && permission === 'serial',
  );
  ses.setPermissionRequestHandler((contents, permission, callback) =>
    callback(contents === win.webContents && trusted(contents.getURL()) && permission === 'serial'),
  );
  ses.webRequest.onHeadersReceived((details, callback) =>
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'",
        ],
      },
    }),
  );
  ses.removeAllListeners('select-serial-port');
  ses.on('select-serial-port', async (event, ports, contents, callback) => {
    event.preventDefault();
    if (contents !== win.webContents || !trusted(contents.getURL())) {
      callback('');
      return;
    }
    const english = await contents
      .executeJavaScript("document.documentElement.lang === 'en'")
      .catch(() => false);
    if (!ports.length) {
      callback('');
      void dialog.showMessageBox(win, {
        type: 'info',
        message: english ? 'No controller found' : 'Nenhum controlador encontrado',
        detail: english
          ? 'Connect the Nano via USB, close other apps using the port and try again.'
          : 'Conecte o Nano por USB, feche outros aplicativos que usam a porta e tente novamente.',
      });
      return;
    }
    const removed = new Set<string>();
    const onRemoved = (_event: Electron.Event, port: Electron.SerialPort) => {
      removed.add(port.portId);
    };
    ses.on('serial-port-removed', onRemoved);
    void dialog
      .showMessageBox(win, {
        type: 'question',
        title: english ? 'Connect controller' : 'Conectar controlador',
        message: english ? 'Select your controller port' : 'Selecione a porta do seu controlador',
        detail: english
          ? 'Select the Arduino Nano. Cancel to connect another device and refresh the list.'
          : 'Escolha o Arduino Nano. Cancele para conectar outro dispositivo e atualizar a lista.',
        buttons: [
          english ? 'Cancel' : 'Cancelar',
          ...ports.map((p) => `${p.displayName || p.portName} (${p.portName})`),
        ],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
      })
      .then(({ response }) => {
        const port = ports[response - 1];
        callback(port && !removed.has(port.portId) ? port.portId : '');
      })
      .catch(() => callback(''))
      .finally(() => ses.removeListener('serial-port-removed', onRemoved));
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!trusted(url)) event.preventDefault();
  });
  win.once('ready-to-show', () => win.show());
  win.on('closed', () => {
    window = null;
  });
  void win.loadFile(entry);
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => {
    if (window?.isMinimized()) window.restore();
    window?.focus();
  });
  void app.whenReady().then(createWindow);
  app.on('activate', () => {
    if (!BrowserWindow.getAllWindows().length) createWindow();
  });
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
