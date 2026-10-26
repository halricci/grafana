'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');

const policy = require('./security.cjs');
const source = fs.readFileSync(path.join(__dirname, 'security.cjs'), 'utf8');

describe('desktop sign-in security policy', () => {
  it('exports only the sign-in policy fields', () => {
    assert.deepEqual(Object.keys(policy).sort(), [
      'loadIndexHtmlFromDisk',
      'sessionCookieName',
      'startUrl',
      'useDefaultSession',
      'webPreferences',
    ]);
  });

  it('opens the local Grafana server instead of a file on disk', () => {
    assert.equal(policy.startUrl, 'http://127.0.0.1:3000');
    assert.equal(policy.loadIndexHtmlFromDisk, false);
    assert.equal(policy.startUrl.startsWith('file:'), false);
  });

  it('names the server session cookie and does not mutate cookies', () => {
    assert.equal(policy.sessionCookieName, 'grafana_session');
    assert.match(source, /const sessionCookieName = 'grafana_session'/);
    assert.equal(policy.setCookie, undefined);
    assert.equal(policy.clearCookies, undefined);
    assert.doesNotMatch(source, /cookies\.(set|remove|flush)|clearStorageData|setCookie|clearCookies/);
  });

  it('uses the default session and does not set a partition', () => {
    assert.equal(policy.useDefaultSession, true);
    assert.equal(Object.hasOwn(policy, 'partition'), false);
    assert.equal(Object.hasOwn(policy.webPreferences, 'partition'), false);
    assert.doesNotMatch(source, /partition\s*:/);
  });

  it('locks the renderer away from Node', () => {
    assert.deepEqual(policy.webPreferences, {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    });
    assert.deepEqual(Object.keys(policy.webPreferences).sort(), [
      'contextIsolation',
      'nodeIntegration',
      'sandbox',
      'webSecurity',
    ]);
  });

  it('stays a local policy module with no Electron import or credentials', () => {
    assert.doesNotMatch(source, /require\(['"]electron['"]\)/);
    assert.doesNotMatch(source, /require\(['"](?:http|https|net)['"]\)/);
    assert.doesNotMatch(source, /process\.env/);
    assert.doesNotMatch(source, /password\s*[:=]|api[_-]?key|secret\s*[:=]|token\s*[:=]/i);
  });
});
