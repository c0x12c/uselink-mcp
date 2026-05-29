import { z } from "zod";
import type { ToolDefinition } from "../server.js";

const ListProjectsInputSchema = z.object({
  include_archived: z.boolean().default(false),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(50),
});
type ListProjectsInput = z.infer<typeof ListProjectsInputSchema>;

const ProjectIdInputSchema = z.object({
  id: z.string().uuid(),
});
type ProjectIdInput = z.infer<typeof ProjectIdInputSchema>;

const CreateProjectInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
});
type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;

const UpdateProjectInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
});
type UpdateProjectInput = z.infer<typeof UpdateProjectInputSchema>;

const RenameProjectSlugInputSchema = z.object({
  id: z.string().uuid(),
  new_slug: z.string().min(1),
});
type RenameProjectSlugInput = z.infer<typeof RenameProjectSlugInputSchema>;

const CheckProjectSlugInputSchema = z.object({
  slug: z.string().min(1),
});
type CheckProjectSlugInput = z.infer<typeof CheckProjectSlugInputSchema>;

const MoveProjectToWorkspaceInputSchema = z.object({
  project_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
});
type MoveProjectToWorkspaceInput = z.infer<typeof MoveProjectToWorkspaceInputSchema>;

const RemoveProjectFromWorkspaceInputSchema = z.object({
  project_id: z.string().uuid(),
});
type RemoveProjectFromWorkspaceInput = z.infer<typeof RemoveProjectFromWorkspaceInputSchema>;

export const projectTools: ToolDefinition<unknown>[] = [
  {
    name: "uselink_list_projects",
    description:
      "List projects the active PAT can see. Workspace-scoped tokens see projects in that workspace; personal tokens see the user's personal projects. Returns id, name, slug, default flag, archive state, document count.",
    inputSchema: {
      type: "object",
      properties: {
        include_archived: { type: "boolean", default: false },
        offset: { type: "number", default: 0 },
        limit: { type: "number", default: 50, maximum: 100 },
      },
    },
    parse: (raw) => ListProjectsInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/projects/list", input as ListProjectsInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_read_project",
    description: "Read a single project by id.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
    parse: (raw) => ProjectIdInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/projects/read", input as ProjectIdInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_create_project",
    description:
      "Create a new project. Workspace is inferred from the PAT — workspace-scoped tokens create inside that workspace, personal tokens create a personal project. Slug is auto-generated from the name if omitted.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Project display name" },
        slug: { type: "string", description: "URL slug (optional — derived from name)" },
      },
      required: ["name"],
    },
    parse: (raw) => CreateProjectInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/projects/create", input as CreateProjectInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_update_project",
    description: "Update a project's name and/or slug. Only provided fields change.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        slug: { type: "string" },
      },
      required: ["id"],
    },
    parse: (raw) => UpdateProjectInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/projects/update", input as UpdateProjectInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_archive_project",
    description: "Soft-archive a project. Its documents stay accessible by direct URL but no longer appear in listings.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
    parse: (raw) => ProjectIdInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/projects/archive", input as ProjectIdInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_unarchive_project",
    description: "Restore a previously archived project.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
    parse: (raw) => ProjectIdInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/projects/unarchive", input as ProjectIdInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_rename_project_slug",
    description: "Rename a project's URL slug. The old slug stops resolving immediately.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        new_slug: { type: "string" },
      },
      required: ["id", "new_slug"],
    },
    parse: (raw) => RenameProjectSlugInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>(
        "/projects/rename-slug",
        input as RenameProjectSlugInput,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_check_project_slug",
    description: "Check whether a project slug is available in the PAT's workspace. Returns { available, suggestion? }.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string" } },
      required: ["slug"],
    },
    parse: (raw) => CheckProjectSlugInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>(
        "/projects/check-slug",
        input as CheckProjectSlugInput,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_set_default_project",
    description:
      "Make this the user's default project. Newly created documents (when no explicit project is given) land here.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
    parse: (raw) => ProjectIdInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/projects/set-default", input as ProjectIdInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_move_project_to_workspace",
    description: "Move a personal project into a workspace.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", format: "uuid" },
        workspace_id: { type: "string", format: "uuid" },
      },
      required: ["project_id", "workspace_id"],
    },
    parse: (raw) => MoveProjectToWorkspaceInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>(
        "/projects/move-to-workspace",
        input as MoveProjectToWorkspaceInput,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
  {
    name: "uselink_remove_project_from_workspace",
    description: "Remove a project from its workspace and return it to the user's personal projects.",
    inputSchema: {
      type: "object",
      properties: { project_id: { type: "string", format: "uuid" } },
      required: ["project_id"],
    },
    parse: (raw) => RemoveProjectFromWorkspaceInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>(
        "/projects/remove-from-workspace",
        input as RemoveProjectFromWorkspaceInput,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
];
