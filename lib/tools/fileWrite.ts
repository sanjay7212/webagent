import { tool } from "ai";
import { z } from "zod";
import { resolveWorkspacePath } from "../sandbox/workspace";
import fs from "fs/promises";
import path from "path";

export function fileWriteTool(workspaceId: string) {
  return tool({
    description:
      "Write content to a file. Creates parent directories if needed. Overwrites existing content.",
    inputSchema: z.object({
      file_path: z.string().describe("Relative path to the file in the workspace"),
      content: z.string().describe("The content to write to the file"),
    }),
    execute: async ({ file_path, content }) => {
      const resolved = resolveWorkspacePath(workspaceId, file_path);
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      await fs.writeFile(resolved, content, "utf-8");
      return `File written: ${file_path} (${content.length} chars)`;
    },
  });
}
