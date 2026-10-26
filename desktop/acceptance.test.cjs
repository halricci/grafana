'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const contract = require('./acceptance.cjs');

const readme = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');

test('opens one window at the loopback start URL', () => {
  assert.equal(contract.windowCount, 1);
  assert.equal(contract.startUrl, 'http://127.0.0.1:3000');
  assert.equal(contract.goServerUnchanged, true);
  assert.equal(contract.csrfUnchanged, true);
  assert.equal(contract.rootUrlUnchanged, true);
});

test('keeps the grafana_session cookie name unchanged', () => {
  assert.equal(contract.sessionCookieName, 'grafana_session');
  assert.equal(contract.sessionCookieNameUnchanged, true);
  assert.equal(contract.usesDefaultSession, true);
  assert.equal(contract.refreshKeepsSession, true);
  assert.equal(contract.browserTabUrl, 'http://localhost:3000');
  assert.equal(contract.browserTabStillWorks, true);
});

test('does not load index.html from disk', () => {
  assert.equal(contract.indexHtmlPath, 'public/views/index.html');
  assert.equal(contract.indexHtmlIsGoTemplate, true);
  assert.equal(contract.loadIndexHtmlFromDisk, false);
});

test('includes no Go files in the desktop change', () => {
  assert.equal(contract.goFilesInDesktopChange, false);
  for (const file of contract.filesInThisChange) {
    assert.notEqual(path.extname(file), '.go');
  }

  const names = fs.readdirSync(__dirname);
  const goFiles = names.filter((name) => name.endsWith('.go'));
  assert.deepEqual(goFiles, []);
});

test('leaves sibling implementation files out of this pull request', () => {
  assert.deepEqual(contract.notInThisPr, [
    'desktop/main.cjs',
    'desktop/security.cjs',
    'package.json',
    'desktop/electron-builder.config.cjs',
  ]);
  assert.deepEqual(contract.filesInThisChange, [
    'desktop/README.md',
    'desktop/acceptance.cjs',
    'desktop/acceptance.test.cjs',
  ]);

  const ownedHere = new Set(contract.filesInThisChange);
  for (const file of contract.notInThisPr) {
    assert.equal(ownedHere.has(file), false);
  }
});

test('uses the normal login page and adds no credential', () => {
  assert.equal(contract.loginUsesNormalPage, true);
  assert.equal(contract.documentedLocalDefaultUser, 'admin');
  assert.equal(contract.documentedLocalDefaultPassword, 'admin');
  assert.equal(contract.introducesCredential, false);
  assert.equal(contract.signInPerformedOnThisBranch, false);
});

test('records the manual checklist as unchecked and not run', () => {
  assert.equal(contract.manualChecklistRunOnThisBranch, false);
  assert.deepEqual(
    contract.manualChecklist.map((item) => item.step),
    [
      'make run',
      'yarn start',
      'go test -count=1 ./pkg/api/webassets/',
      'yarn desktop',
      'sign in',
    ]
  );
  for (const item of contract.manualChecklist) {
    assert.equal(item.checked, false);
  }
});

test('README states the contract and leaves the checklist unchecked', () => {
  assert.match(readme, /http:\/\/127\.0\.0\.1:3000/);
  assert.match(readme, /grafana_session/);
  assert.match(readme, /CSRF stays unchanged/);
  assert.match(readme, /root_url` stays unchanged/);
  assert.match(readme, /public\/views\/index\.html/);
  assert.match(readme, /does not read `public\/views\/index\.html` from disk/);
  assert.match(readme, /default session/);
  assert.match(readme, /http:\/\/localhost:3000/);
  assert.match(readme, /desktop\/main\.cjs/);
  assert.match(readme, /desktop\/security\.cjs/);
  assert.match(readme, /desktop\/electron-builder\.config\.cjs/);
  assert.match(readme, /package\.json/);
  assert.match(readme, /This pull request leaves those files out/);
  assert.match(readme, /no Go files/);
  assert.match(readme, /These steps were not run on this branch/);
  assert.match(readme, /Sign-in was not performed/);
  assert.match(readme, /- \[ \] `make run`/);
  assert.match(readme, /- \[ \] `yarn start`/);
  assert.match(readme, /- \[ \] `go test -count=1 \.\/pkg\/api\/webassets\/`/);
  assert.match(readme, /- \[ \] `yarn desktop`/);
  assert.match(readme, /- \[ \] Sign in/);
  assert.doesNotMatch(readme, /- \[[xX]\]/);
});
