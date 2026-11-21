#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { createMcpServer } from './server.mjs';
import { createHttpServer } from './http.mjs';

if (process.argv.includes('--http')) {
  const server = createHttpServer();
  const port = Number(process.env.PORT || 3300);
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.listen(port, process.env.HOST || '127.0.0.1', () => console.error(`NewKitchenAI read-only MCP listening on ${port}`));
  const close = () => server.close(() => process.exit(0));
  process.on('SIGTERM', close);
  process.on('SIGINT', close);
} else {
  await createMcpServer().connect(new StdioServerTransport());
}
