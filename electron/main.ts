import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';

const isDev = process.env['NODE_ENV'] === 'development';
const PROTOCOL = 'coachdiary';

let mainWindow: BrowserWindow | null = null;
let pendingAuthCallbackUrl: string | null = null;

function isAuthCallbackUrl(url: string): boolean {
  return url.startsWith(`${PROTOCOL}://auth-callback`);
}

function sendAuthCallback(url: string): void {
  if (mainWindow) {
    mainWindow.webContents.send('auth:callback', url);
  } else {
    pendingAuthCallbackUrl = url;
  }
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.webContents.once('did-finish-load', () => {
    if (pendingAuthCallbackUrl) {
      sendAuthCallback(pendingAuthCallbackUrl);
      pendingAuthCallbackUrl = null;
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:4200');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'browser', 'index.html'));
  }
}

// Dev mode registers the Electron binary itself under the protocol; pass the
// launch script explicitly so the OS reopens *this* app, not bare electron.exe.
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  // Windows/Linux: a second launch (e.g. via the OS handing off the OAuth
  // redirect) arrives here as argv on the already-running instance.
  app.on('second-instance', (_event, argv) => {
    const url = argv.find(isAuthCallbackUrl);
    if (url) sendAuthCallback(url);

    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // macOS delivers the URL directly via this event instead.
  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (isAuthCallbackUrl(url)) sendAuthCallback(url);
  });

  ipcMain.handle('shell:openExternal', (_event, url: string) => shell.openExternal(url));

  // Windows/Linux cold start: the OS may launch this process directly with
  // the callback URL as an argv entry rather than going through 'second-instance'.
  const initialUrl = process.argv.find(isAuthCallbackUrl);
  if (initialUrl) pendingAuthCallbackUrl = initialUrl;

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
