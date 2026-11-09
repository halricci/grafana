import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { getGrafanaUrl, isLoopbackUrl, waitForHealth } from './loopback.js';

const MAIN_WINDOW_WIDTH = 1400;
const MAIN_WINDOW_HEIGHT = 900;
const WAITING_WINDOW_WIDTH = 420;
const WAITING_WINDOW_HEIGHT = 180;

const here = path.dirname(fileURLToPath(import.meta.url));
const waitingPage = path.join(here, 'waiting.html');
const waitingPageUrl = pathToFileURL(waitingPage).href;

function windowOptions({ width, height, resizable = true }) {
  return {
    width,
    height,
    resizable,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  };
}

function isAllowedInAppNavigation(urlString) {
  if (urlString === 'about:blank') {
    return true;
  }
  if (urlString === waitingPageUrl || urlString.startsWith(`${waitingPageUrl}?`)) {
    return true;
  }
  return isLoopbackUrl(urlString);
}

function attachNavigationGuards(contents) {
  contents.setWindowOpenHandler(({ url }) => {
    if (isAllowedInAppNavigation(url)) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  contents.on('will-navigate', (event, url) => {
    if (!isAllowedInAppNavigation(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  contents.on('will-redirect', (event, url) => {
    if (!isAllowedInAppNavigation(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

function createWaitingWindow() {
  const win = new BrowserWindow(
    windowOptions({
      width: WAITING_WINDOW_WIDTH,
      height: WAITING_WINDOW_HEIGHT,
      resizable: false,
    })
  );
  win.setTitle('Grafana Desktop');
  win.loadFile(waitingPage);
  return win;
}

function createMainWindow(grafanaUrl) {
  const win = new BrowserWindow(
    windowOptions({
      width: MAIN_WINDOW_WIDTH,
      height: MAIN_WINDOW_HEIGHT,
    })
  );
  win.loadURL(grafanaUrl);
  return win;
}

let starting = false;

async function start() {
  if (starting) {
    return;
  }
  starting = true;

  try {
    const grafanaUrl = getGrafanaUrl();
    const waitingWindow = createWaitingWindow();
    const controller = new AbortController();
    let grafanaReady = false;

    waitingWindow.on('closed', () => {
      if (!grafanaReady) {
        controller.abort();
      }
    });

    try {
      await waitForHealth(grafanaUrl, { signal: controller.signal });
      grafanaReady = true;
    } catch {
      if (process.platform !== 'darwin') {
        app.quit();
      }
      return;
    }

    if (!waitingWindow.isDestroyed()) {
      waitingWindow.close();
    }

    createMainWindow(grafanaUrl);
  } finally {
    starting = false;
  }
}

app.on('web-contents-created', (_event, contents) => {
  attachNavigationGuards(contents);
});

app.whenReady().then(() => {
  start();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    start();
  }
});
