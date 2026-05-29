import { z } from "zod";
import type { ToolDefinition } from "../server.js";

const ListFoldersInputSchema = z.object({
  project_id: z.string().uuid(),
  parent_folder_id: z.string().uuid().optional(),
});
type ListFoldersInput = z.infer<typeof ListFoldersInputSchema>;

const FolderIdInputSchema = z.object({
  id: z.string().uuid(),
});
type FolderIdInput = z.infer<typeof FolderIdInputSchema>;

const CreateFolderInputSchema = z.object({
  project_id: z.string().uuid(),
  parent_folder_id: z.string().uuid().optional(),
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
});
type CreateFolderInput = z.infer<typeof CreateFolderInputSchema>;

const UpdateFolderInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
});
type UpdateFolderInput = z.infer<typeof UpdateFolderInputSchema>;

const MoveFolderInputSchema = z.object({
  id: z.string().uuid(),
  parent_folder_id: z.string().uuid().optional(),
});
type MoveFolderInput = z.infer<typeof MoveFolderInputSchema>;

export const folderTools: ToolDefinition<unknown>[] = [
  {
    name: "uselink_list_folders",
    description:
      "List folders in a project. Pass parent_folder_id to list children of a specific folder; omit it to list folders at the project root. Returns folders plus a parent_breadcrumb for navigation.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", format: "uuid" },
        parent_folder_id: { type: "string", format: "uuid", description: "Optional — list root folders if omitted" },
      },
      required: ["project_id"],
    },
    parse: (raw) => ListFoldersInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/folders/list", input as ListFoldersInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_read_folder",
    description: "Read a single folder by id, including doc / live / draft counts.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
    parse: (raw) => FolderIdInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/folders/read", input as FolderIdInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_create_folder",
    description:
      "Create a new folder inside a project. Omit parent_folder_id to create at the project root, or pass a folder id to nest. Slug is auto-generated from the name if omitted.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", format: "uuid" },
        parent_folder_id: { type: "string", format: "uuid", description: "Parent folder (optional — root if omitted)" },
        name: { type: "string" },
        slug: { type: "string", description: "Optional — derived from name" },
        color: { type: "string", description: "Optional folder color token" },
      },
      required: ["project_id", "name"],
    },
    parse: (raw) => CreateFolderInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/folders/create", input as CreateFolderInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_update_folder",
    description: "Update a folder's name, slug, or color. Only provided fields change.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        slug: { type: "string" },
        color: { type: "string" },
      },
      required: ["id"],
    },
    parse: (raw) => UpdateFolderInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/folders/update", input as UpdateFolderInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_move_folder",
    description:
      "Re-parent a folder. Omit parent_folder_id to move the folder to the project root, or pass a folder id to nest under it.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        parent_folder_id: { type: "string", format: "uuid", description: "Optional — root if omitted" },
      },
      required: ["id"],
    },
    parse: (raw) => MoveFolderInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/folders/move", input as MoveFolderInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_delete_folder",
    description:
      "Delete a folder. Documents inside the folder are NOT deleted — they are moved back to the project root.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
    parse: (raw) => FolderIdInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/folders/delete", input as FolderIdInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
];
