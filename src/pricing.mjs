import { catalog, website } from './catalog.mjs';

export function createPricingReader({ fetchImpl = fetch, now = Date.now } = {}) {
  let cached;
  let expiresAt = 0;
  let pending;
  return async function readPricing() {
    if (cached && now() < expiresAt) return cached;
    if (pending) return pending;
    pending = (async () => {
      try {
        // 地址固定，不接收调用者 URL；缓存合并并发读取，限制超时和响应大小。
        const response = await fetchImpl(`${website}/pricing.md`, {
          signal: AbortSignal.timeout(6000),
          redirect: 'error',
          headers: { Accept: 'text/markdown', 'User-Agent': 'NewKitchenAI-MCP/1.0.0' },
        });
        if (!response.ok || Number(response.headers.get('content-length')) > 80000) throw new Error('价格读取失败');
        const reader = response.body.getReader();
        const chunks = [];
        let size = 0;
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 80000) { await reader.cancel(); throw new Error('价格响应过大'); }
          chunks.push(value);
        }
        const text = Buffer.concat(chunks).toString('utf8');
        if (!text.startsWith('# NewKitchenAI Pricing')) throw new Error('价格内容不符');
        cached = { source: 'live', url: `${website}/pricing`, retrievedAt: new Date(now()).toISOString(), text };
        expiresAt = now() + 3600000;
      } catch {
        cached = {
          source: 'snapshot', asOf: catalog.updatedAt, url: `${website}/pricing`,
          note: 'The live pricing page is temporarily unavailable. This is a dated snapshot; verify current prices and taxes at checkout.',
          currency: 'USD', packs: catalog.packs, creditsPerDesign: catalog.creditsPerDesign,
        };
        expiresAt = now() + 60000;
      }
      return cached;
    })();
    try { return await pending; } finally { pending = undefined; }
  };
}
