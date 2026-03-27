import { tool } from "ai";
import { z } from "zod";
import { resolveWorkspacePath, ensureWorkspace } from "../sandbox/workspace";
import fs from "fs/promises";

const MEMORY_FILE = "memory.md";

export function memoryReadTool(workspaceId: string) {
  return tool({
    description:
      "Read the workspace memory file. Contains persistent notes, decisions, and context that persists across messages.",
    inputSchema: z.object({}),
    execute: async () => {
      await ensureWorkspace(workspaceId);
      const memoryPath = resolveWorkspacePath(workspaceId, MEMORY_FILE);
      try {
        return await fs.readFile(memoryPath, "utf-8");
      } catch {
        return "(No memory file exists yet. Use memoryWrite to create one.)";
      }
    },
  });
}

export function memoryWriteTool(workspaceId: string) {
  return tool({
    description:
      "Write or append to the workspace memory file. Use this to persist important context, decisions, plans, or findings across messages.",
    inputSchema: z.object({
      content: z
        .string()
        .describe("Content to write to the memory file"),
      mode: z
        .enum(["overwrite", "append"])
        .default("append")
        .describe("Whether to overwrite the file or append to it"),
    }),
    execute: async ({ content, mode }) => {
      await ensureWorkspace(workspaceId);
      const memoryPath = resolveWorkspacePath(workspaceId, MEMORY_FILE);
      if (mode === "append") {
        let existing = "";
        try {
          existing = await fs.readFile(memoryPath, "utf-8");
        } catch {
          // File doesn't exist yet
        }
        const separator = existing ? "\n\n---\n\n" : "";
        const timestamp = new Date().toISOString();
        await fs.writeFile(
          memoryPath,
          `${existing}${separator}## ${timestamp}\n\n${content}`,
          "utf-8"
        );
      } else {
        await fs.writeFile(memoryPath, content, "utf-8");
      }
      return "Memory updated successfully.";
    },
  });
}
