'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path  = require('path');
const Store = require('electron-store');

const API_BASE = process.env.OVERRIDE_API_BASE || 'https://api-production-3d66.up.railway.app';

let store      = null;
let mainWindow = null;

// ── Single instance lock — dos ventanas del mismo Mostrador en el mismo PC no aporta nada,
// solo confunde en el mostrador cuál está activa. ──────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }
app.on('second-instance', () => { mainWindow?.show(); mainWindow?.focus(); });

function applyApiKey(apiKey) {
  process.env.API_BASE_URL = API_BASE;
  process.env.API_KEY = apiKey || '';
}

// ── IPC: configuración (misma X-API-Key que el sync-agent normal — se pide una vez y se
// guarda en electron-store, independiente de la config del sync-agent). ──────────────────
ipcMain.handle('get-config', () => {
  const cfg = store.get('config', {});
  return { apiKey: cfg.apiKey || '', tenantName: cfg.tenantName || '' };
});

ipcMain.handle('test-api-key', async (_, apiKey) => {
  const prevKey = process.env.API_KEY;
  applyApiKey(apiKey);
  try {
    const api = require('../src/api-client');
    const s = await api.status();
    const nombre = s.tenant?.nombre || s.nombre || 'Farmacia';
    return { ok: true, nombre };
  } catch (err) {
    process.env.API_KEY = prevKey;
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('save-config', (_, cfg) => {
  store.set('config', cfg);
  applyApiKey(cfg.apiKey);
});

// ── IPC: Mostrador — igual que en el sync-agent (electron/main.js `mostrador-buscar` /
// `mostrador-gp`), aquí es la única funcionalidad de la app en vez de una pestaña más. ────
ipcMain.handle('mostrador-buscar', async (_, q) => {
  if (!process.env.API_KEY) return { ok: false, error: 'Configura primero la API Key' };
  try {
    const api = require('../src/api-client');
    const resultados = await api.request(`/api/sync/publicitarios/mostrador/buscar?q=${encodeURIComponent(q || '')}`);
    return { ok: true, resultados };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('mostrador-gp', async (_, cn) => {
  if (!process.env.API_KEY) return { ok: false, error: 'Configura primero la API Key' };
  try {
    const api = require('../src/api-client');
    const gps = await api.request(`/api/sync/publicitarios/gps?cn=${encodeURIComponent(cn)}`);
    return { ok: true, gp: gps[0] || null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── Ventana pequeña, pensada para dejar junto a Farmatic sin taparlo — pedido explícito del
// titular: "debe verse bien la info pero ser una ventana pequeña para que sea manejable". ──
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 620,
    minWidth: 320,
    minHeight: 420,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    title: 'NextFarma Mostrador',
    backgroundColor: '#0f172a',
    show: false,
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(() => {
  store = new Store({ name: 'nextfarma-mostrador', cwd: app.getPath('userData') });
  const cfg = store.get('config', {});
  if (cfg.apiKey) applyApiKey(cfg.apiKey);
  createWindow();
});

app.on('window-all-closed', () => { app.quit(); });
