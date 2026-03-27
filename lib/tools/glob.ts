import { tool } from "ai";
import { z } from "zod";
import { getWorkspacePath } from "../sandbox/workspace";
import fg from "fast-glob";

export function globTool(workspaceId: string) {
  return tool({
    description:
      "Search for files matching a glob pattern in the workspace. Returns matching file paths.",
    inputSchema: z.object({
      pattern: z.string().describe('Glob pattern (e.g. "**/*.ts", "src/**/*.js")'),
      path: z
        .string()
        .optional()
        .describe("Subdirectory to search in (relative to workspace)"),
    }),
    execute: async ({ pattern, path: subPath }) => {
      const workspace = getWorkspacePath(workspaceId);
      const cwd = subPath
        ? `${workspace}/${subPath}`
        : workspace;

      const matches = await fg(pattern, {
        cwd,
        dot: false,
        onlyFiles: true,
        ignore: ["node_modules/**", ".git/**"],
      });

      if (matches.length === 0) return "No files found matching pattern.";
      return matches.slice(0, 200).join("\n");
    },
  });
}
