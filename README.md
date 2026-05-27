# @uselink/mcp

Model Context Protocol (MCP) server for [uselink](https://uselink.app). Lets Claude, Cursor, Codex, and other MCP-aware AI tools publish HTML/Markdown docs, upload assets, and reply to stakeholder comments directly from the editor — no manual copy-paste, no portal switch.

> Status: `0.1.0` — all tools shipped.

## Install

```bash
npm install -g @uselink/mcp
```

Or run on demand without a global install:

```bash
npx -y @uselink/mcp
```

## Environment

| Variable | Required | Default | Notes |
|---|---|---|---|
| `USELINK_API_KEY` | Yes | — | Personal access token from uselink → Settings → Developer. Format: `ulk_pat_xxx`. |
| `USELINK_API_BASE` | No | `https://backend.uselink.app` | Override for self-hosted or staging environments. |

## Add to Claude Code

```bash
claude mcp add uselink npx -y @uselink/mcp
```

Then set the API key in the Claude Code MCP environment for the `uselink` server, or export it in your shell before launching Claude Code.

## Tools

### Read tools

| Tool | Description |
|---|---|
| `uselink_list_documents` | List documents in a workspace |
| `uselink_read_document` | Read full document content by ID |
| `uselink_search_documents` | Full-text search across a workspace |
| `uselink_list_comments` | List threaded comments on a document |
| `uselink_list_assets` | List assets attached to a document |

### Write tools

| Tool | Description |
|---|---|
| `uselink_create_document` | Create a new document (HTML or Markdown) |
| `uselink_update_document` | Update title, content, or format (slug is immutable) |
| `uselink_publish_document` | Publish a document (makes it publicly accessible) |
| `uselink_unpublish_document` | Unpublish a document |
| `uselink_delete_document` | Delete a document |
| `uselink_upload_asset` | Upload an image or file from local disk |
| `uselink_upload_zip` | Upload a zip archive; server extracts and stores each file |
| `uselink_reply_comment` | Reply to an existing comment thread |
| `uselink_resolve_comment` | Mark a comment thread as resolved |

### Orchestrator

| Tool | Description |
|---|---|
| `uselink_publish_with_assets` | Upload local images, rewrite `<img src>` to CDN URLs, create document, and publish — in one call |

## Development

```bash
npm install
npm run build      # compile to dist/
npm run dev        # run via tsx
npm run smoke      # local smoke test (lists tools)
```

## Publishing

This package publishes from CI on tags matching `mcp-v*.*.*` via `.github/workflows/publish-mcp.yml`.

**Prerequisite (one-time, manual):** the `@uselink` npm organization must be reserved on npmjs.com and the `NPM_TOKEN` secret added to the GitHub repo before the first publish.

## License

MIT
