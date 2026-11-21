# NewKitchenAI MCP

[![mcptry](https://mcptry.com/badge/com.newkitchenai/kitchen-design)](https://mcptry.com/servers/com.newkitchenai/kitchen-design)

Read-only kitchen styles, materials, AI design examples and pricing for [NewKitchenAI](https://newkitchenai.com/), a photo-based **AI kitchen design tool**.

[Website](https://newkitchenai.com/) · [Design your kitchen](https://newkitchenai.com/kitchen-design) · [Before & after examples](https://newkitchenai.com/kitchen-remodel-before-after) · [Pricing](https://newkitchenai.com/pricing) · [MCP documentation](https://newkitchenai.com/mcp/docs)

Official source: [weiwosuoai/newkitchenai-mcp](https://github.com/weiwosuoai/newkitchenai-mcp). Registry name: `com.newkitchenai/kitchen-design`.

## What it does

Use this MCP to look up kitchen styles and finish options, find examples, and understand NewKitchenAI's prices and limitations from an MCP-compatible assistant.

It **does not generate or edit images**, accept photos, access accounts, buy credits or spend your balance. To generate your own kitchen design, use the [website tool](https://newkitchenai.com/kitchen-design). Website generation requires Google sign-in and purchased credits; the free preset walkthrough uses existing examples.

## Connect to the hosted MCP

Endpoint: **`https://newkitchenai.com/mcp`**

- Transport: Streamable HTTP
- Authentication: none; all available information is public and read-only
- Documentation: [newkitchenai.com/mcp/docs](https://newkitchenai.com/mcp/docs)

In an MCP client that accepts remote servers, add the endpoint above. For Cursor's MCP configuration:

```json
{
  "mcpServers": {
    "newkitchenai": {
      "url": "https://newkitchenai.com/mcp"
    }
  }
}
```

Client setup varies by application and version. You must add the server to a compatible client before it can call these tools.

## Tools

| Tool | Purpose |
| --- | --- |
| `get_product_info` | Capabilities, website requirements, limitations and official links |
| `list_kitchen_styles` | 14 kitchen styles with public preview images |
| `get_kitchen_materials` | Cabinet finishes, countertops, backsplash, flooring, lighting and kitchen elements |
| `get_design_examples` | Existing-kitchen and unfinished-room concepts, plus sequential refinements |
| `get_pricing` | Current website pricing with a clearly dated fallback snapshot |

`get_kitchen_materials` accepts an optional `category`: `cabinets`, `counters`, `backsplash`, `floor`, `lighting`, or `elements`.

Resources: `newkitchenai://catalog` and `newkitchenai://pricing`, both JSON.

## Example questions

- Which kitchen design styles does NewKitchenAI offer?
- What countertop options can I explore in my kitchen photo?
- Show me examples of an unfinished kitchen and a cabinet-color refinement.
- How much do NewKitchenAI's one-time credit packs cost?
- Can this tool create measured construction plans?

## Kitchen design examples

The [before-and-after page](https://newkitchenai.com/kitchen-remodel-before-after) shows an existing kitchen remodel and an unfinished-room concept. The [refinement sequence](https://newkitchenai.com/kitchen-remodel-before-after#cabinet-colors) starts from an AI concept, changes lower cabinets to sage green, then explores a dark countertop.

These are AI-generated examples, not finished renovation photos or customer testimonials. Results can change layout and details. They are visual concepts, not construction drawings, exact color samples, product specifications or renovation quotes. Verify measurements and feasibility with a qualified professional before building.

## Run locally

Requires Node.js 22 or later. Clone this repository, then:

```sh
npm ci
npm test
npm start
```

The default transport is stdio. For a local HTTP endpoint:

```sh
npm run start:http
```

The HTTP listener defaults to `127.0.0.1:3300`; endpoint `/mcp`, docs `/mcp/docs`, health `/mcp/health`. Set `HOST=0.0.0.0` only when intentionally exposing the listener. Host and Origin validation permit `newkitchenai.com` and loopback addresses. A different production domain requires explicitly updating those allowlists.

For stdio, configure your client to run `node` with the absolute path to `src/index.mjs` as its argument. No API keys are needed.

## Data freshness and privacy

- Public styles and options are a snapshot dated **2026-11-21**, exported from the website's purchasing and style configuration. Private generation prompts are not included.
- Pricing is fetched only from [the official Markdown pricing page](https://newkitchenai.com/pricing.md), with a one-hour cache. If unavailable, a snapshot is returned with `source: "snapshot"`, its date and a warning to verify checkout prices.
- Local stdio pricing requests connect to NewKitchenAI. Hosted HTTP use sends protocol requests to our server; infrastructure may record connection metadata such as IP, path and status. The service does not store tool argument bodies or use tracking cookies.
- Do not send personal photos or secrets to this MCP. See the website's [privacy policy](https://newkitchenai.com/privacy-policy) and [terms](https://newkitchenai.com/terms-of-service).

## Maintenance

Run `npm test` and `npm run check` before releases. Keep the catalog aligned with the website's public styles and options. Verify checkout facts before updating the snapshot. Changes to the live website do not automatically rewrite the checked-in catalog.

The Dockerfile runs as a non-root user. No website credentials, database connection, image-provider account or billing integration is required.

Contact: [support@newkitchenai.com](mailto:support@newkitchenai.com)

## License

MIT for this server's source code. Linked website images and third-party materials retain their respective rights; this license does not relicense them.
