'use strict';

// Contract data for the desktop window. Sibling branches own the launcher.
module.exports = {
  windowCount: 1,
  startUrl: 'http://127.0.0.1:3000',
  sessionCookieName: 'grafana_session',
  sessionCookieNameUnchanged: true,
  csrfUnchanged: true,
  rootUrlUnchanged: true,
  goServerUnchanged: true,
  indexHtmlPath: 'public/views/index.html',
  indexHtmlIsGoTemplate: true,
  loadIndexHtmlFromDisk: false,
  goFilesInDesktopChange: false,
  usesDefaultSession: true,
  refreshKeepsSession: true,
  browserTabUrl: 'http://localhost:3000',
  browserTabStillWorks: true,
  loginUsesNormalPage: true,
  documentedLocalDefaultUser: 'admin',
  documentedLocalDefaultPassword: 'admin',
  introducesCredential: false,
  manualChecklistRunOnThisBranch: false,
  signInPerformedOnThisBranch: false,
  filesInThisChange: [
    'desktop/README.md',
    'desktop/acceptance.cjs',
    'desktop/acceptance.test.cjs',
  ],
  notInThisPr: [
    'desktop/main.cjs',
    'desktop/security.cjs',
    'package.json',
    'desktop/electron-builder.config.cjs',
  ],
  manualChecklist: [
    { step: 'make run', checked: false },
    { step: 'yarn start', checked: false },
    { step: 'go test -count=1 ./pkg/api/webassets/', checked: false },
    { step: 'yarn desktop', checked: false },
    { step: 'sign in', checked: false },
  ],
};
