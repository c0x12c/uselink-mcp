# @uselink/mcp

Model Context Protocol (MCP) server for [uselink](https://uselink.app). Lets Claude, Cursor, Codex, and other MCP-aware AI tools publish HTML/Markdown docs, upload assets, and reply to stakeholder comments directly from the editor — no manual copy-paste, no portal switch.

> Status: `0.2.0` — adds project + folder management and document moves.

---

## Two ways to connect

Uselink supports two parallel authentication paths. Pick one — they don't overlap.

### Option A — stdio + Personal Access Token (this package)

Best for CI/CD pipelines, scripted workflows, and power users who want fine-grained, revocable tokens.

```bash
claude mcp add uselink npx -y @uselink/mcp
```

Then set `USELINK_API_KEY=ulk_pat_xxx` in the Claude Code MCP environment. Full tool catalog (documents, projects, folders, webhooks orchestration) — everything below.

### Option B — HTTP + OAuth (browser login, no token paste)

Best for non-technical users (PM, designers) and tools that mandate OAuth (Claude.ai Connectors, Cursor extension store).

```bash
claude mcp add --transport http uselink <USELINK_BACKEND_URL>/mcp
```

Browser opens, you log in to uselink, click "Allow" on the consent screen, done. Token rotation and revocation are automatic. Manage authorized clients at uselink → Settings → Connected Apps.

Tool coverage on HTTP transport is currently the document + asset + comment surface (14 tools). Project and folder tools remain stdio-only until they are wired into the HTTP server.

> Both paths talk to the same backend; revoking via Settings → Connected Apps does not affect PATs, and rotating a PAT does not affect OAuth-issued tokens.

---

## Install (Option A)

```bash
npm install -g @uselink/mcp
```

Or run on demand without a global install:

```bash
npx -y @uselink/mcp
```

## Environment (Option A)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `USELINK_API_KEY` | Yes | — | Personal access token from uselink → Settings → Developer. Format: `ulk_pat_xxx`. |
| `USELINK_API_BASE` | No | uselink production backend | Override for self-hosted or staging environments. |

---

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
| `uselink_create_document` | Create a new document. Pass `project_id` and/or `folder_id` to drop it in a specific location |
| `uselink_update_document` | Update title, content, or format (slug is immutable) |
| `uselink_move_document` | Move a document into a different project / folder |
| `uselink_publish_document` | Publish a document (makes it publicly accessible) |
| `uselink_unpublish_document` | Unpublish a document |
| `uselink_delete_document` | Delete a document |
| `uselink_upload_asset` | Upload an image or file from local disk |
| `uselink_upload_zip` | Upload a zip archive; server extracts and stores each file |
| `uselink_reply_comment` | Reply to an existing comment thread |
| `uselink_resolve_comment` | Mark a comment thread as resolved |

### Project tools

Require `projects:read` (list/read/check-slug) or `projects:write` (everything else) on the PAT. **Stdio + PAT only — not yet on HTTP transport.**

| Tool | Description |
|---|---|
| `uselink_list_projects` | List projects the PAT can see |
| `uselink_read_project` | Read a project by id |
| `uselink_create_project` | Create a project (workspace inferred from PAT) |
| `uselink_update_project` | Update name / slug |
| `uselink_archive_project` | Soft-archive a project |
| `uselink_unarchive_project` | Restore an archived project |
| `uselink_rename_project_slug` | Rename a project's slug |
| `uselink_check_project_slug` | Check whether a slug is available |
| `uselink_set_default_project` | Mark a project as the user's default |
| `uselink_move_project_to_workspace` | Move a personal project into a workspace |
| `uselink_remove_project_from_workspace` | Move a project back to personal |

### Folder tools

Require `folders:read` (list/read) or `folders:write` (everything else) on the PAT. **Stdio + PAT only — not yet on HTTP transport.**

| Tool | Description |
|---|---|
| `uselink_list_folders` | List folders in a project (or under a parent folder) |
| `uselink_read_folder` | Read a folder by id |
| `uselink_create_folder` | Create a folder inside a project |
| `uselink_update_folder` | Update name / slug / color |
| `uselink_move_folder` | Re-parent a folder |
| `uselink_delete_folder` | Delete a folder (docs inside are moved to the project root) |

### Account tools

Require `account:write` on the PAT.

| Tool | Description |
|---|---|
| `uselink_set_url_handle` | Set the user's public URL handle (3-30 lowercase letters/digits/hyphens, no leading/trailing hyphen). Required once before publishing the first document. Call this when publish returns `USERNAME_REQUIRED`. |

### Orchestrator

| Tool | Description |
|---|---|
| `uselink_publish_with_assets` | Upload local images, rewrite `<img src>` to CDN URLs, create document, and publish — in one call |

---

## OAuth scopes (Option B only)

When you connect via HTTP transport, the consent screen lists these scopes:

| Scope | Grants |
|---|---|
| `docs:read` | List, read, and search your documents |
| `docs:write` | Create, update, publish, unpublish, and delete documents |
| `assets:write` | Upload images and files to your documents |
| `comments:read` | Read comments on your documents |
| `comments:moderate` | Reply to and resolve comments on your documents |
| `account:write` | Set your public URL handle (required to publish your first doc) |

Authorized clients can be listed and revoked individually at uselink → Settings → Connected Apps.

---

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
