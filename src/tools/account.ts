import { z } from "zod";
import type { ToolDefinition } from "../server.js";

const SetUrlHandleInputSchema = z.object({
  handle: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, {
      message:
        "handle must be 3-30 lowercase letters/digits/hyphens with no leading or trailing hyphen",
    }),
});
type SetUrlHandleInput = z.infer<typeof SetUrlHandleInputSchema>;

export const accountTools: ToolDefinition<unknown>[] = [
  {
    name: "uselink_set_url_handle",
    description:
      "Set the user's public URL handle. Required once before publishing the first document. Call this when publish returns USERNAME_REQUIRED. Handle format: 3-30 lowercase letters/digits/hyphens (no leading/trailing hyphen). Returns the updated user.",
    inputSchema: {
      type: "object",
      properties: {
        handle: {
          type: "string",
          description:
            "Desired URL handle, e.g. 'alex-doe'. 3-30 chars, lowercase letters/digits/hyphens, no leading/trailing hyphen.",
        },
      },
      required: ["handle"],
    },
    parse: (raw) => SetUrlHandleInputSchema.parse(raw),
    handler: async (input, client) => {
      const data = await client.post<unknown>("/users/set_handle", input as SetUrlHandleInput);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    },
  },
];
