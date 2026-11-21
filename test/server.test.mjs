import assert from 'node:assert/strict';
import test from 'node:test';
import http from 'node:http';
import { Client, InMemoryTransport, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpServer } from '../src/server.mjs';
import { createHttpServer } from '../src/http.mjs';
import { createPricingReader } from '../src/pricing.mjs';

async function withClient(run) {
  const server = createMcpServer({ readPricing: async () => ({ source: 'live', text: '# NewKitchenAI Pricing\nStart $9.99', url: 'https://newkitchenai.com/pricing' }) });
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  try { await run(client); } finally { await client.close(); await server.close(); }
}

test('协议提供五个只读工具，公开目录不包含生成提示词或密钥', async () => {
  await withClient(async client => {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(t => t.name).sort(), ['get_design_examples', 'get_kitchen_materials', 'get_pricing', 'get_product_info', 'list_kitchen_styles']);
    for (const tool of tools) assert.equal(tool.annotations.readOnlyHint, true);
    const styles = await client.callTool({ name: 'list_kitchen_styles', arguments: {} });
    assert.equal(styles.structuredContent.styles.length, 14);
    assert.doesNotMatch(JSON.stringify(styles), /api_key|private.key|"prompt"|seedream|sunburst/i);
    const info = await client.callTool({ name: 'get_product_info', arguments: {} });
    assert.equal(info.structuredContent.generationAvailableThroughMcp, false);
    assert.equal(info.structuredContent.ownPhotoGenerationIsFree, false);
    const resources = await client.listResources();
    assert.ok(resources.resources.some(r => r.uri === 'newkitchenai://catalog'));
    const resource = await client.readResource({ uri: 'newkitchenai://catalog' });
    assert.equal(resource.contents[0].mimeType, 'application/json');
  });
});

test('材质类别筛选正确，未知类别被拒绝，案例明确标注 AI 来源', async () => {
  await withClient(async client => {
    const materials = await client.callTool({ name: 'get_kitchen_materials', arguments: { category: 'counters' } });
    assert.equal(materials.structuredContent.categories.length, 1);
    assert.equal(materials.structuredContent.categories[0].id, 'counters');
    const invalid = await client.callTool({ name: 'get_kitchen_materials', arguments: { category: 'https://example.com' } });
    assert.equal(invalid.isError, true);
    const examples = await client.callTool({ name: 'get_design_examples', arguments: {} });
    assert.match(examples.structuredContent.note, /AI/);
    assert.ok(examples.structuredContent.examples.every(e => e.url.startsWith('https://newkitchenai.com/')));
  });
});

test('价格只读取固定官网，缓存并发请求，失联时明确返回有日期的快照', async () => {
  let calls = 0;
  const read = createPricingReader({ fetchImpl: async url => { calls++; assert.equal(url, 'https://newkitchenai.com/pricing.md'); return new Response('# NewKitchenAI Pricing\nStart $9.99'); } });
  const values = await Promise.all([read(), read(), read()]);
  assert.equal(calls, 1);
  assert.ok(values.every(v => v.source === 'live'));
  const offline = createPricingReader({ fetchImpl: async () => { throw new Error('offline'); } });
  const fallback = await offline();
  assert.equal(fallback.source, 'snapshot');
  assert.equal(fallback.asOf, '2026-11-21');
  assert.match(fallback.note, /checkout/i);
});

test('HTTP 可以真实握手和调用，拒绝恶意 Host、Origin、超大请求和写入路径', async () => {
  const server = createHttpServer({ readPricing: async () => ({ source: 'live', text: '# NewKitchenAI Pricing', url: 'https://newkitchenai.com/pricing' }) });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const client = new Client({ name: 'http-test', version: '1.0.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(base + '/mcp')));
    assert.equal((await client.listTools()).tools.length, 5);
    assert.equal((await client.callTool({ name: 'get_product_info', arguments: {} })).isError, undefined);
    assert.equal((await fetch(base + '/mcp')).status, 405);
    assert.equal((await fetch(base + '/mcp', { method: 'POST', headers: { Origin: 'https://evil.example' } })).status, 403);
    const badHostStatus = await new Promise((resolve, reject) => {
      http.get(base + '/mcp', { headers: { Host: 'evil.example' } }, response => {
        response.resume(); resolve(response.statusCode);
      }).on('error', reject);
    });
    assert.equal(badHostStatus, 403);
    assert.equal((await fetch(base + '/mcp', { method: 'POST', body: 'a'.repeat(20000) })).status, 413);
    assert.equal((await fetch(base + '/api/kitchen/jobs', { method: 'POST' })).status, 404);
    const legacy = await fetch(base + '/mcp', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'legacy-test', version: '1.0.0' } } }),
    });
    assert.equal(legacy.status, 200);
    assert.ok((await legacy.json()).result.serverInfo.name.includes('newkitchenai'));
    const docs = await fetch(base + '/mcp/docs');
    assert.equal(docs.status, 200);
    assert.match(await docs.text(), /https:\/\/newkitchenai.com\//);
  } finally { await client.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
