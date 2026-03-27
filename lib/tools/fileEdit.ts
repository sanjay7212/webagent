import { tool } from "ai";
import { z } from "zod";
import { resolveWorkspacePath } from "../sandbox/workspace";
import fs from "fs/promises";

export function fileEditTool(workspaceId: string) {
  return tool({
    description:
      "Edit a file by replacing an exact string match with new content. The old_string must appear exactly once in the file.",
    inputSchema: z.object({
      file_path: z.string().describe("Relative path to the file in the workspace"),
      old_string: z.string().describe("The exact string to find and replace"),
      new_string: z.string().describe("The replacement string"),
    }),
    execute: async ({ file_path, old_string, new_string }) => {
      const resolved = resolveWorkspacePath(workspaceId, file_path);
      const content = await fs.readFile(resolved, "utf-8");

      const occurrences = content.split(old_string).length - 1;
      if (occurrences === 0) {
        return `Error: old_string not found in ${file_path}`;
      }
      if (occurrences > 1) {
        return `Error: old_string found ${occurrences} times in ${file_path}. Must be unique.`;
      }

      const updated = content.replace(old_string, new_string);
      await fs.writeFile(resolved, updated, "utf-8");
      return `File edited: ${file_path}`;
    },
  });
}
