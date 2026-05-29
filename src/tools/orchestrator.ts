import { z } from "zod";
import { readFile, stat } from "fs/promises";
import { basename, extname, resolve as resolvePath } from "path";
import { parse as parseHtml } from "node-html-parser";
import { FormData, File } from "undici";
import type { ToolDefinition } from "../server.js";
import type { UselinkClient } from "../client.js";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".zip": "application/zip",
};

function detectContentType(filePath: string): string {
  return MIME_BY_EXT[extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

const PublishWithAssetsInputSchema = z.object({
  title: z.string().min(1).optional(),
  html: z.string().min(1),
  assets_dir: z.string().optional(),
});
type PublishWithAssetsInput = z.infer<typeof PublishWithAssetsInputSchema>;

interface AssetUploadResult {
  id: string;
  url: string;
  filename?: string;
  [key: string]: unknown;
}

interface CreateDocumentResult {
  id: string;
  [key: string]: unknown;
}

interface PublishDocumentResult {
  publicUrl?: string;
  public_url?: string;
  [key: string]: unknown;
}

async function uploadFile(
  client: UselinkClient,
  documentId: string,
  filePath: string,
): Promise<AssetUploadResult> {
  await stat(filePath);
  const buffer = await readFile(filePath);
  const form = new FormData();
  const contentType = detectContentType(filePath);
  form.append("document_id", documentId);
  form.append("file", new File([buffer], basename(filePath), { type: contentType }));
  return client.postMultipart<AssetUploadResult>("/assets/upload", form);
}

function collectLocalSrcs(html: string): string[] {
  const root = parseHtml(html);
  const srcs = new Set<string>();
  for (const img of root.querySelectorAll("img")) {
    const src = img.getAttribute("src") ?? "";
    if (
      src.length > 0 &&
      !src.startsWith("http://") &&
      !src.startsWith("https://") &&
      !src.startsWith("data:") &&
      !src.startsWith("//")
    ) {
      srcs.add(src);
    }
  }
  return [...srcs];
}

function rewriteSrcs(html: string, srcMap: Map<string, string>): string {
  let result = html;
  for (const [original, cdnUrl] of srcMap) {
    result = result.split(original).join(cdnUrl);
  }
  return result;
}

export const orchestratorTools: ToolDefinition<unknown>[] = [
  {
    name: "uselink_publish_with_assets",
    description:
      "One-shot publish: create a draft document, upload every local <img src> referenced in the HTML as an asset, rewrite the HTML to point to CDN URLs, save the rewritten HTML to the document, and publish it. Returns the public URL plus a list of assets uploaded and any rewrites applied. Use this when you have an HTML document with relative image paths and want to publish it to uselink in a single step.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Document title (optional)" },
        html: { type: "string", description: "Full HTML content; may contain local <img src> paths" },
        assets_dir: {
          type: "string",
          description:
            "Base directory for resolving relative image paths. Defaults to the current working directory.",
        },
      },
      required: ["html"],
    },
    parse: (raw) => PublishWithAssetsInputSchema.parse(raw),
    handler: async (input, client) => {
      const { title, html, assets_dir } = input as PublishWithAssetsInput;
      const baseDir = assets_dir ? resolvePath(assets_dir) : process.cwd();

      // Step 1: create a draft document so we have an id for asset uploads.
      const draft = await client.post<CreateDocumentResult>("/documents/create", {
        ...(title !== undefined ? { title } : {}),
        format: "html",
      });
      const documentId = draft.id;
      if (typeof documentId !== "string" || documentId.length === 0) {
        throw new Error("documents/create did not return an id");
      }

      // Step 2: walk the HTML, upload local <img src> assets, build the rewrite map.
      const localSrcs = collectLocalSrcs(html);
      const srcMap = new Map<string, string>();
      const uploaded: Array<{ src: string; url: string }> = [];
      const uploadErrors: string[] = [];

      for (const src of localSrcs) {
        const absolutePath = src.startsWith("/") ? src : resolvePath(baseDir, src);
        try {
          const result = await uploadFile(client, documentId, absolutePath);
          srcMap.set(src, result.url);
          uploaded.push({ src, url: result.url });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          uploadErrors.push(`${src}: ${message}`);
        }
      }

      // Step 3: write the rewritten HTML (or the original, if nothing was rewritten).
      const finalHtml = srcMap.size > 0 ? rewriteSrcs(html, srcMap) : html;
      await client.post<unknown>("/documents/update", {
        id: documentId,
        content: finalHtml,
        format: "html",
      });

      // Step 4: publish.
      const published = await client.post<PublishDocumentResult>("/documents/publish", {
        id: documentId,
      });
      const publicUrl = published.publicUrl ?? published.public_url ?? null;

      const summary: Record<string, unknown> = {
        document_id: documentId,
        public_url: publicUrl,
        assets_uploaded: uploaded,
        rewrites: uploaded.map(({ src, url }) => ({ from: src, to: url })),
      };
      if (uploadErrors.length > 0) {
        summary["upload_errors"] = uploadErrors;
      }

      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
    },
  },
];
