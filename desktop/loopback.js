import { URL } from 'node:url';

export const DEFAULT_GRAFANA_URL = 'http://127.0.0.1:3000';
const HEALTH_POLL_MS = 1000;

export function getGrafanaUrl(env = process.env) {
  const fromEnv = env.GRAFANA_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return fromEnv.trim();
  }
  return DEFAULT_GRAFANA_URL;
}

function unwrapIpv6Hostname(hostname) {
  return hostname.replace(/^\[|\]$/g, '').toLowerCase();
}

function isLoopbackHostname(hostname) {
  const host = unwrapIpv6Hostname(hostname);
  if (host === 'localhost' || host === '::1') {
    return true;
  }
  // 127.0.0.0/8
  return /^127(?:\.(?:\d{1,3})){3}$/.test(host);
}

export function isLoopbackUrl(urlString) {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    return isLoopbackHostname(url.hostname);
  } catch {
    return false;
  }
}

export function healthUrl(grafanaUrl) {
  return new URL('/api/health', grafanaUrl).href;
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new Error('Aborted'));
      return;
    }

    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason ?? new Error('Aborted'));
      },
      { once: true }
    );
  });
}

export async function waitForHealth(grafanaUrl, options = {}) {
  const { fetchImpl = fetch, intervalMs = HEALTH_POLL_MS, signal } = options;
  const url = healthUrl(grafanaUrl);

  while (true) {
    if (signal?.aborted) {
      throw signal.reason ?? new Error('Aborted while waiting for Grafana');
    }

    try {
      const response = await fetchImpl(url, { signal });
      if (response.status === 200) {
        return;
      }
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
    }

    await sleep(intervalMs, signal);
  }
}

export function shouldOpenExternally(urlString) {
  return !isLoopbackUrl(urlString);
}
