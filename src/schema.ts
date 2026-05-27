import { z } from "zod";

// Empty for now — populated by Wave E2/E3/E4 once endpoints are confirmed.
// Schemas are kept in this file so tool registration in server.ts can import them
// without circular references back to handler logic.

export const PingInputSchema = z.object({});
export type PingInput = z.infer<typeof PingInputSchema>;
