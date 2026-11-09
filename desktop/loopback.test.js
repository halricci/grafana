import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { describe, it } from 'node:test';

import {
  DEFAULT_GRAFANA_URL,
  getGrafanaUrl,
  healthUrl,
  isLoopbackUrl,
  shouldOpenExternally,
  waitForHealth,
} from './loopback.js';

describe('getGrafanaUrl', () => {
  it('defaults to loopback port 3000', () => {
    assert.equal(getGrafanaUrl({}), DEFAULT_GRAFANA_URL);
    assert.equal(DEFAULT_GRAFANA_URL, 'http://127.0.0.1:3000');
  });

  it('uses GRAFANA_URL when set', () => {
    assert.equal(getGrafanaUrl({ GRAFANA_URL: 'http://127.0.0.1:3010/' }), 'http://127.0.0.1:3010/');
  });

  it('ignores blank GRAFANA_URL', () => {
    assert.equal(getGrafanaUrl({ GRAFANA_URL: '   ' }), DEFAULT_GRAFANA_URL);
  });
});

describe('isLoopbackUrl', () => {
  it('allows loopback http(s) hosts', () => {
    assert.equal(isLoopbackUrl('http://127.0.0.1:3000/login'), true);
    assert.equal(isLoopbackUrl('https://localhost/'), true);
    assert.equal(isLoopbackUrl('http://[::1]:3000/api/health'), true);
    assert.equal(isLoopbackUrl('http://127.0.0.2:3000'), true);
  });

  it('rejects off-loopback and non-http URLs', () => {
    assert.equal(isLoopbackUrl('https://grafana.com'), false);
    assert.equal(isLoopbackUrl('http://192.168.1.10:3000'), false);
    assert.equal(isLoopbackUrl('http://0.0.0.0:3000'), false);
    assert.equal(isLoopbackUrl('file:///etc/passwd'), false);
    assert.equal(isLoopbackUrl('javascript:alert(1)'), false);
    assert.equal(isLoopbackUrl('not a url'), false);
  });
});

describe('shouldOpenExternally', () => {
  it('opens non-loopback URLs in the system browser', () => {
    assert.equal(shouldOpenExternally('https://grafana.com/docs'), true);
    assert.equal(shouldOpenExternally('http://127.0.0.1:3000/d/abc'), false);
  });
});

describe('healthUrl', () => {
  it('rewrites any Grafana URL to /api/health', () => {
    assert.equal(healthUrl('http://127.0.0.1:3000'), 'http://127.0.0.1:3000/api/health');
    assert.equal(healthUrl('http://127.0.0.1:3000/'), 'http://127.0.0.1:3000/api/health');
    assert.equal(healthUrl('http://127.0.0.1:3000/login?foo=1'), 'http://127.0.0.1:3000/api/health');
  });
});

describe('waitForHealth', () => {
  it('resolves when /api/health returns 200 after a non-200', { timeout: 5000 }, async () => {
    let hits = 0;
    const server = createServer((req, res) => {
      if (req.url !== '/api/health') {
        res.writeHead(404);
        res.end();
        return;
      }
      hits += 1;
      res.writeHead(hits === 1 ? 503 : 200);
      res.end(hits === 1 ? 'unhealthy' : 'ok');
    });

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();

    try {
      await waitForHealth(`http://127.0.0.1:${port}`, { intervalMs: 20 });
      assert.equal(hits >= 2, true);
    } finally {
      server.close();
    }
  });

  it('keeps polling while the server is down, then succeeds', { timeout: 5000 }, async () => {
    const server = createServer((req, res) => {
      res.writeHead(req.url === '/api/health' ? 200 : 404);
      res.end('ok');
    });

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));

    const wait = waitForHealth(`http://127.0.0.1:${port}`, { intervalMs: 30 });
    await new Promise((resolve) => setTimeout(resolve, 40));
    await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

    try {
      await wait;
    } finally {
      server.close();
    }
  });

  it('stops when aborted', { timeout: 5000 }, async () => {
    const controller = new AbortController();
    const pending = waitForHealth('http://127.0.0.1:1', { intervalMs: 20, signal: controller.signal });
    controller.abort();
    await assert.rejects(pending);
  });
});
