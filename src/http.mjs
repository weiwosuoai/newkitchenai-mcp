import http from 'node:http';
import { readFileSync } from 'node:fs';
import { NodeStreamableHTTPServerTransport, hostHeaderValidation, originValidation } from '@modelcontextprotocol/node';
import { createMcpServer } from './server.mjs';
import { createPricingReader } from './pricing.mjs';
import { version } from './catalog.mjs';

export function createHttpServer({ readPricing = createPricingReader(), registryProof = process.env.MCP_REGISTRY_PROOF || '', rateLimit = 180 } = {}) {
  const validateHost = hostHeaderValidation(['newkitchenai.com', 'localhost', '127.0.0.1', '[::1]']);
  const validateOrigin = originValidation(['newkitchenai.com', 'localhost', '127.0.0.1', '[::1]']);
  const counters = new Map();
  const json = (res, status, value, extra = {}) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra }); res.end(JSON.stringify(value)); };
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (!validateHost(req, res) || !validateOrigin(req, res)) return;
    const route = new URL(req.url, 'http://localhost').pathname;
    if (route === '/mcp/health' && req.method === 'GET') return json(res, 200, { status: 'ok', version, readOnly: true });
    if (route === '/.well-known/mcp-registry-auth' && req.method === 'GET' && registryProof) {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' }); res.end(registryProof + '\n'); return;
    }
    if (route === '/mcp/docs' && (req.method === 'GET' || req.method === 'HEAD')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'" });
      res.end(req.method === 'HEAD' ? '' : readFileSync(new URL('../public/docs.html', import.meta.url))); return;
    }
    if (route !== '/mcp') return json(res, 404, { error: 'Not found' });
    if (req.method !== 'POST') return json(res, 405, { error: 'Use Streamable HTTP POST at /mcp. See /mcp/docs.' }, { Allow: 'POST' });
    // 仅按真实连接地址限流，不信任调用者伪造的转发头；代理层保持私有网络访问。
    const now = Date.now();
    if (counters.size > 10000) for (const [key, value] of counters) if (value.until <= now) counters.delete(key);
    const key = req.socket.remoteAddress || 'unknown';
    let count = counters.get(key);
    if (!count || count.until <= now) { count = { used: 0, until: now + 60000 }; counters.set(key, count); }
    if (++count.used > rateLimit) return json(res, 429, { error: 'Too many requests' }, { 'Retry-After': '60' });
    if (Number(req.headers['content-length']) > 8192) return json(res, 413, { error: 'Request too large' });
    let size = 0;
    const chunks = [];
    try {
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 8192) return json(res, 413, { error: 'Request too large' });
        chunks.push(chunk);
      }
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return json(res, 400, { error: 'Invalid JSON' }); }
      if (Array.isArray(body)) return json(res, 400, { error: 'Batch requests are not supported' });
      const server = createMcpServer({ readPricing });
      const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.once('close', () => { void transport.close(); void server.close(); });
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch {
      if (!res.headersSent) json(res, 500, { error: 'MCP request failed' });
      else res.end();
    }
  });
}
