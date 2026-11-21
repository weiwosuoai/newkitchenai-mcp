import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { catalog, examples, product, version, website } from './catalog.mjs';
import { createPricingReader } from './pricing.mjs';

const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const result = output => ({ content: [{ type: 'text', text: JSON.stringify(output, null, 2) }], structuredContent: output });

export function createMcpServer({ readPricing = createPricingReader() } = {}) {
  const server = new McpServer({ name: 'newkitchenai', version, websiteUrl: website, title: 'NewKitchenAI — Kitchen Design Reference' }, {
    instructions: 'Read-only public information about NewKitchenAI. This server does not generate images, upload photos, purchase credits or access user accounts. Prices may be dated when source is snapshot; verify them on the website. AI design images are concepts, not construction plans.',
    maxToolInputElements: 20,
  });
  server.registerTool('get_product_info', {
    title: 'NewKitchenAI capabilities and limits',
    description: 'Get photo-based kitchen design capabilities, payment requirements, limitations and official website links. Does not generate images.',
    inputSchema: z.strictObject({}), annotations,
  }, async () => result(product));
  server.registerTool('list_kitchen_styles', {
    title: 'Kitchen style catalog',
    description: 'List the kitchen design styles and preview-image links available on NewKitchenAI.',
    inputSchema: z.strictObject({}), annotations,
  }, async () => result({ asOf: catalog.updatedAt, styles: catalog.styles, website: `${website}/kitchen-design` }));
  server.registerTool('get_kitchen_materials', {
    title: 'Kitchen materials and lighting options',
    description: 'Look up cabinet finishes, countertops, backsplash, flooring, lighting and kitchen element options in the website tool.',
    inputSchema: z.strictObject({ category: z.enum(['cabinets', 'counters', 'backsplash', 'floor', 'lighting', 'elements']).optional() }), annotations,
  }, async ({ category }) => result({ asOf: catalog.updatedAt, categories: catalog.materials.filter(item => !category || item.id === category), note: 'Selections guide an AI concept; they are not purchasable products or measured specifications.', website: `${website}/kitchen-design` }));
  server.registerTool('get_design_examples', {
    title: 'Kitchen remodel and refinement examples',
    description: 'Get existing and unfinished kitchen before/after examples, plus a cabinet-color and countertop refinement sequence.',
    inputSchema: z.strictObject({}), annotations,
  }, async () => result(examples));
  server.registerTool('get_pricing', {
    title: 'NewKitchenAI pricing',
    description: 'Read official one-time credit-pack prices and usage rules. Reads the website with a dated fallback if unavailable. Does not purchase or charge credits.',
    inputSchema: z.strictObject({}), annotations: { ...annotations, openWorldHint: true },
  }, async () => result(await readPricing()));
  server.registerResource('catalog', 'newkitchenai://catalog', {
    title: 'NewKitchenAI public product catalog', mimeType: 'application/json',
  }, async uri => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify({ product, styles: catalog.styles, materials: catalog.materials, examples }, null, 2) }] }));
  server.registerResource('pricing', 'newkitchenai://pricing', {
    title: 'NewKitchenAI public pricing', mimeType: 'application/json',
  }, async uri => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(await readPricing(), null, 2) }] }));
  return server;
}
