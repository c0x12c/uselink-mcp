import { z } from "zod";
import { readFile, stat } from "fs/promises";
import { basename } from "path";
import { FormData, File } from "undici";
import type { ToolDefinition } from "../server.js";

const CreateDocumentInputSchema = z.object({
  title: z.string().min(1).optional(),
  format: z.enum(["html", "markdown"]).default("markdown"),
  content: z.string().optional(),
});
type CreateDocumentInput = z.infer<typeof CreateDocumentInputSchema>;

const UpdateDocumentInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  format: z.enum(["html", "markdown"]).optional(),
});
type UpdateDocumentInput = z.infer<typeof UpdateDocumentInputSchema>;

const DocumentIdInputSchema = z.object({
  id: z.string().uuid(),
});
type DocumentIdInput = z.infer<typeof DocumentIdInputSchema>;

const UploadAssetInputSchema = z.object({
  document_id: z.string().uuid(),
  file_path: z.string().min(1),
});
type UploadAssetInput = z.infer<typeof UploadAssetInputSchema>;

const UploadZipInputSchema = z.object({
  document_id: z.string().uuid(),
  zip_path: z.string().min(1),
});
type UploadZipInput = z.infer<typeof UploadZipInputSchema>;

const ReplyCommentInputSchema = z.object({
  document_id: z.string().uuid(),
  parent_comment_id: z.string().uuid(),
  body: z.string().min(1).max(4000),
});
type ReplyCommentInput = z.infer<typeof ReplyCommentInputSchema>;

const ResolveCommentInputSchema = z.object({
  comment_id: z.string().uuid(),
});
type ResolveCommentInput = z.infer<typeof ResolveCommentInputSchema>;

async function buildMultipart(documentId: string, filePath: string): Promise<FormData> {
  await stat(filePath);
  const buffer = await readFile(filePath);
  const form = new FormData();
  form.append("document_id", documentId);
  form.append("file", new File([buffer], basename(filePath)));
  return form;
}

export const writeTools: ToolDefinition<unknown>[] = [
  {
    name: "uselink_create_document",
    description:
      "Create a new draft document in the uselink workspace bound to the active PAT. Returns the created document including its id, slug, and edit URL. Content can be omitted and added later via uselink_update_document.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Document title (optional)" },
        format: {
          type: "string",
          enum: ["html", "markdown"],
          default: "markdown",
          description: "Document format",
        },
        content: { type: "string", description: "Initial draft body (HTML or Markdown)" },
      },
    },
    parse: (raw) => CreateDocumentInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/documents/create", input as CreateDocumentInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_update_document",
    description:
      "Update an existing uselink document's title, content, or format. Only provided fields are changed. This updates the draft only — call uselink_publish_document to make changes public.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid", description: "Document UUID" },
        title: { type: "string" },
        content: { type: "string" },
        format: { type: "string", enum: ["html", "markdown"] },
      },
      required: ["id"],
    },
    parse: (raw) => UpdateDocumentInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/documents/update", input as UpdateDocumentInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_publish_document",
    description:
      "Publish a uselink document. Snapshots the current draft into the published version and makes it accessible via the public URL. Returns the document with its public URL.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid", description: "Document UUID" },
      },
      required: ["id"],
    },
    parse: (raw) => DocumentIdInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/documents/publish", input as DocumentIdInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_unpublish_document",
    description: "Unpublish a uselink document, removing it from public access. The draft is preserved.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid", description: "Document UUID" },
      },
      required: ["id"],
    },
    parse: (raw) => DocumentIdInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/documents/unpublish", input as DocumentIdInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_delete_document",
    description: "Delete a uselink document. The document is removed and the public URL stops working.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid", description: "Document UUID" },
      },
      required: ["id"],
    },
    parse: (raw) => DocumentIdInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/documents/delete", input as DocumentIdInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_upload_asset",
    description:
      "Upload a single image or file from the local filesystem and attach it to a uselink document. Returns the asset with its CDN URL. Use the returned URL in your document's HTML/Markdown.",
    inputSchema: {
      type: "object",
      properties: {
        document_id: { type: "string", format: "uuid", description: "Document UUID" },
        file_path: { type: "string", description: "Absolute or relative path to the file on disk" },
      },
      required: ["document_id", "file_path"],
    },
    parse: (raw) => UploadAssetInputSchema.parse(raw),
    handler: async (input, client) => {
      const { document_id, file_path } = input as UploadAssetInput;
      const form = await buildMultipart(document_id, file_path);
      const data = await client.postMultipart<unknown>("/assets/upload", form);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_upload_zip",
    description:
      "Upload a zip archive containing an HTML page and its referenced assets. The server extracts the zip, stores every asset, rewrites <img src> references to CDN URLs, and returns the rewritten HTML plus the list of assets created and skipped.",
    inputSchema: {
      type: "object",
      properties: {
        document_id: { type: "string", format: "uuid", description: "Document UUID" },
        zip_path: { type: "string", description: "Absolute or relative path to the .zip file" },
      },
      required: ["document_id", "zip_path"],
    },
    parse: (raw) => UploadZipInputSchema.parse(raw),
    handler: async (input, client) => {
      const { document_id, zip_path } = input as UploadZipInput;
      const form = await buildMultipart(document_id, zip_path);
      const data = await client.postMultipart<unknown>("/assets/upload_zip", form);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_reply_comment",
    description:
      "Post a reply to an existing comment thread on a uselink document. Replies are nested under the parent comment.",
    inputSchema: {
      type: "object",
      properties: {
        document_id: { type: "string", format: "uuid" },
        parent_comment_id: {
          type: "string",
          format: "uuid",
          description: "UUID of the parent (root) comment being replied to",
        },
        body: { type: "string", description: "Reply body (plain text or Markdown, max 4000 chars)" },
      },
      required: ["document_id", "parent_comment_id", "body"],
    },
    parse: (raw) => ReplyCommentInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/comments/reply", input as ReplyCommentInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_resolve_comment",
    description: "Mark a comment thread on a uselink document as resolved.",
    inputSchema: {
      type: "object",
      properties: {
        comment_id: { type: "string", format: "uuid", description: "Comment thread UUID" },
      },
      required: ["comment_id"],
    },
    parse: (raw) => ResolveCommentInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/comments/resolve", input as ResolveCommentInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
];
