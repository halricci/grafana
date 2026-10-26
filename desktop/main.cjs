'use strict';

const { app, BrowserWindow } = require('electron');

const FALLBACK_WEB_PREFERENCES = {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  webSecurity: true,
};

function resolveWebPreferences() {
  try {
    // security.cjs is optional and is absent on this branch.
    const security = require('./security.cjs');
    if (security && security.webPreferences && typeof security.webPreferences === 'object') {
      return security.webPreferences;
    }
  } catch {
    // Missing module is expected here; the fallback below applies.
  }
  return FALLBACK_WEB_PREFERENCES;
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    // No partition: the default session lets grafana_session survive refresh.
    webPreferences: resolveWebPreferences(),
  });

  window.loadURL('http://127.0.0.1:3000');
}

app.on('ready', () => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
