import { z } from "zod";
import type { ToolDefinition } from "../server.js";

const ListDocumentsInputSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(20),
});
type ListDocumentsInput = z.infer<typeof ListDocumentsInputSchema>;

const ReadDocumentInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    slug: z.string().min(1).optional(),
  })
  .refine((v) => (v.id !== undefined) !== (v.slug !== undefined), {
    message: "Exactly one of id or slug is required (not both, not neither)",
  });
type ReadDocumentInput = z.infer<typeof ReadDocumentInputSchema>;

const SearchDocumentsInputSchema = z.object({
  query: z.string().min(1),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(50).default(10),
});
type SearchDocumentsInput = z.infer<typeof SearchDocumentsInputSchema>;

const ListCommentsInputSchema = z.object({
  document_id: z.string().uuid(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(50),
});
type ListCommentsInput = z.infer<typeof ListCommentsInputSchema>;

const ListAssetsInputSchema = z.object({
  document_id: z.string().uuid(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(50),
});
type ListAssetsInput = z.infer<typeof ListAssetsInputSchema>;

export const readTools: ToolDefinition<unknown>[] = [
  {
    name: "uselink_list_documents",
    description:
      "List documents in the uselink workspace bound to the active PAT. Returns id, title, slug, status, and timestamps. Supports filtering by status and free-text search.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status: draft, published, unpublished" },
        search: { type: "string", description: "Free-text search on title/content" },
        offset: { type: "number", default: 0 },
        limit: { type: "number", default: 20, maximum: 100 },
      },
    },
    parse: (raw) => ListDocumentsInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/documents/list", input as ListDocumentsInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_read_document",
    description:
      "Read the full content of a uselink document by id OR slug (exactly one is required). Returns title, content, format, published status, and metadata.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid", description: "Document UUID" },
        slug: { type: "string", description: "Document slug (alternative to id)" },
      },
    },
    parse: (raw) => ReadDocumentInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/documents/read", input as ReadDocumentInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_search_documents",
    description:
      "Free-text search across documents in the workspace bound to the active PAT. Thin wrapper over uselink_list_documents with the search field set.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        offset: { type: "number", default: 0 },
        limit: { type: "number", default: 10, maximum: 50 },
      },
      required: ["query"],
    },
    parse: (raw) => SearchDocumentsInputSchema.parse(raw),
    handler: async (input, client) => {
      const { query, offset, limit } = input as SearchDocumentsInput;
      const data = await client.post<unknown>("/documents/list", {
        search: query,
        offset,
        limit,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_list_comments",
    description: "List threaded comments on a document.",
    inputSchema: {
      type: "object",
      properties: {
        document_id: { type: "string", format: "uuid" },
        offset: { type: "number", default: 0 },
        limit: { type: "number", default: 50, maximum: 100 },
      },
      required: ["document_id"],
    },
    parse: (raw) => ListCommentsInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/comments/list", input as ListCommentsInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_list_assets",
    description: "List assets (images, files) attached to a document.",
    inputSchema: {
      type: "object",
      properties: {
        document_id: { type: "string", format: "uuid" },
        offset: { type: "number", default: 0 },
        limit: { type: "number", default: 50, maximum: 100 },
      },
      required: ["document_id"],
    },
    parse: (raw) => ListAssetsInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/assets/list", input as ListAssetsInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
];
