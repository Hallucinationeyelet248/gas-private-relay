'use strict';

const http = require('http');
const { URL } = require('url');

const LISTEN_HOST = process.env.LISTEN_HOST || '0.0.0.0';
const LISTEN_PORT = Number(process.env.PORT || process.env.LISTEN_PORT || 8080);
const BLOCKED_HOSTS = new Set(
  (process.env.BLOCKED_HOSTS || '')
    .split(',')
    .map(x => x.trim().toLowerCase())
    .filter(Boolean)
);

const HOP_BY_HOP_HEADERS = new Set([
  'host',
  'connection',
  'content-length',
  'transfer-encoding',
  'proxy-connection',
  'proxy-authorization',
  'keep-alive',
  'te',
  'trailer',
  'upgrade'
]);

function sendJson(res, statusCode, obj) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(JSON.stringify(obj));
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sanitizeHeaders(inputHeaders) {
  const headers = new Headers();
  if (!inputHeaders || typeof inputHeaders !== 'object') return headers;

  for (const [key, value] of Object.entries(inputHeaders)) {
    if (!key) continue;
    const lower = String(key).toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower)) continue;
    try {
      headers.set(key, String(value));
    } catch (_) {
      // Ignore invalid header names/values.
    }
  }

  headers.set('x-relay-hop', '1');
  return headers;
}

function isBlockedHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  if (!host) return false;
  if (BLOCKED_HOSTS.has(host)) return true;
  for (const blocked of BLOCKED_HOSTS) {
    if (host === blocked || host.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

async function handleRelay(req, res) {
  try {
    const rawBody = await getRequestBody(req);
    if (!rawBody.length) {
      return sendJson(res, 200, {
        ok: true,
        name: 'gas-private-relay-backend',
        status: 'active'
      });
    }

    const relayReq = JSON.parse(rawBody.toString('utf-8'));

    if (!relayReq.u || typeof relayReq.u !== 'string') {
      return sendJson(res, 400, { e: 'missing url' });
    }

    let targetUrl;
    try {
      targetUrl = new URL(relayReq.u);
    } catch (_) {
      return sendJson(res, 400, { e: 'bad url' });
    }

    if (!/^https?:$/i.test(targetUrl.protocol)) {
      return sendJson(res, 400, { e: 'unsupported protocol' });
    }

    if (isBlockedHost(targetUrl.hostname)) {
      return sendJson(res, 400, { e: 'self-fetch blocked' });
    }

    const fetchOptions = {
      method: String(relayReq.m || 'GET').toUpperCase(),
      headers: sanitizeHeaders(relayReq.h),
      redirect: relayReq.r === false ? 'manual' : 'follow'
    };

    if (relayReq.b) {
      fetchOptions.body = Buffer.from(relayReq.b, 'base64');
    }

    const upstream = await fetch(targetUrl, fetchOptions);
    const upstreamBuffer = Buffer.from(await upstream.arrayBuffer());

    const responseHeaders = {};
    upstream.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return sendJson(res, 200, {
      s: upstream.status,
      h: responseHeaders,
      b: upstreamBuffer.toString('base64')
    });
  } catch (err) {
    return sendJson(res, 502, { e: String(err) });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      name: 'gas-private-relay-backend',
      status: 'active',
      listen: `${LISTEN_HOST}:${LISTEN_PORT}`
    });
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { allow: 'GET, POST' });
    return res.end('Method Not Allowed');
  }

  return handleRelay(req, res);
});

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
  console.log(`gas-private-relay-backend listening on http://${LISTEN_HOST}:${LISTEN_PORT}`);
});
