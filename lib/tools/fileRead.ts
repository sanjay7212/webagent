import { tool } from "ai";
import { z } from "zod";
import { resolveWorkspacePath } from "../sandbox/workspace";
import fs from "fs/promises";

export function fileReadTool(workspaceId: string) {
  return tool({
    description:
      "Read the contents of a file at the given path. Returns numbered lines.",
    inputSchema: z.object({
      file_path: z.string().describe("Relative path to the file in the workspace"),
      offset: z.number().optional().describe("Line number to start from (0-based)"),
      limit: z.number().optional().describe("Max number of lines to read"),
    }),
    execute: async ({ file_path, offset, limit }) => {
      const resolved = resolveWorkspacePath(workspaceId, file_path);
      const content = await fs.readFile(resolved, "utf-8");
      const lines = content.split("\n");
      const start = offset ?? 0;
      const end = limit ? start + limit : lines.length;
      const sliced = lines.slice(start, end);
      return sliced.map((line, i) => `${start + i + 1}\t${line}`).join("\n");
    },
  });
}
