'use strict';

// The Grafana server owns the session cookie and CSRF. This module only
// names the cookie the server already sets. It must not set, rename, or
// clear cookies. Loading index.html from disk would leave the page off the
// server origin, so that cookie and the CSRF token would not apply. A
// partition string would isolate the cookie from the default session.

const sessionCookieName = 'grafana_session';

module.exports = {
  startUrl: 'http://127.0.0.1:3000',
  sessionCookieName,
  useDefaultSession: true,
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    webSecurity: true,
  },
  loadIndexHtmlFromDisk: false,
};
