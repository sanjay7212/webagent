import { tool } from "ai";
import { z } from "zod";
import { getWorkspacePath } from "../sandbox/workspace";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export function grepTool(workspaceId: string) {
  return tool({
    description:
      "Search for a pattern in file contents within the workspace. Returns matching lines with file paths and line numbers.",
    inputSchema: z.object({
      pattern: z.string().describe("Regular expression pattern to search for"),
      glob: z
        .string()
        .optional()
        .describe('File glob filter (e.g. "*.ts", "*.py")'),
      path: z
        .string()
        .optional()
        .describe("Subdirectory to search in (relative to workspace)"),
    }),
    execute: async ({ pattern, glob: fileGlob, path: subPath }) => {
      const workspace = getWorkspacePath(workspaceId);
      const searchDir = subPath ? `${workspace}/${subPath}` : workspace;

      const args = ["-rn", "--color=never", "-E"];
      if (fileGlob) {
        args.push("--include", fileGlob);
      }
      args.push("--exclude-dir=node_modules", "--exclude-dir=.git");
      args.push(pattern, searchDir);

      try {
        const { stdout } = await execFileAsync("grep", args, {
          timeout: 10000,
          maxBuffer: 512 * 1024,
        });

        // Make paths relative to workspace
        const result = stdout.replace(
          new RegExp(workspace + "/", "g"),
          ""
        );

        const lines = result.split("\n").filter(Boolean);
        if (lines.length === 0) return "No matches found.";
        return lines.slice(0, 100).join("\n");
      } catch {
        return "No matches found.";
      }
    },
  });
}
