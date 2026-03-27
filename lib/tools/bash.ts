import { tool } from "ai";
import { z } from "zod";
import { ensureWorkspace } from "../sandbox/workspace";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export function bashTool(workspaceId: string) {
  return tool({
    description:
      "Execute a shell command in the workspace directory. Commands run in a sandboxed environment.",
    inputSchema: z.object({
      command: z.string().describe("The shell command to execute"),
      timeout: z
        .number()
        .optional()
        .describe("Timeout in milliseconds (default 30000)"),
    }),
    execute: async ({ command, timeout }) => {
      const cwd = await ensureWorkspace(workspaceId);
      try {
        const { stdout, stderr } = await execFileAsync(
          "/bin/bash",
          ["-c", command],
          {
            cwd,
            timeout: timeout ?? 30000,
            maxBuffer: 1024 * 1024,
            env: {
              ...process.env,
              HOME: cwd,
              PATH: process.env.PATH,
            },
          }
        );
        let result = stdout;
        if (stderr) {
          result += (result ? "\n" : "") + "STDERR:\n" + stderr;
        }
        return result.slice(0, 50000) || "(no output)";
      } catch (err: unknown) {
        const error = err as { code?: number; stderr?: string; message?: string };
        return `Error (exit ${error.code ?? "?"}): ${error.stderr || error.message || "Unknown error"}`.slice(0, 10000);
      }
    },
  });
}
