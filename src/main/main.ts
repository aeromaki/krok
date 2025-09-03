import { app, BrowserWindow } from 'electron'
import path from 'path'
import createServer from './server';

let mainWindow: BrowserWindow | null;
const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 930,
    //resizable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, '../preload/preload.mjs'),
      sandbox: false
    }
  });

  // Vite dev server URL
  if (isDev) {
    mainWindow.webContents.openDevTools()
    mainWindow.loadURL('http://localhost:5173');
  } else {
    // mainWindow.webContents.openDevTools()
    mainWindow.loadFile('dist/renderer/index.html');
  }
  mainWindow.on('closed', () => mainWindow = null);
}

app.whenReady().then(() => {
  createWindow();
  createServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow == null) {
    createWindow();
  }
});

