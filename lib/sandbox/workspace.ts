import path from "path";
import fs from "fs/promises";

const WORKSPACES_ROOT = path.join(process.cwd(), "workspaces");

export function getWorkspacesRoot(): string {
  return WORKSPACES_ROOT;
}

export async function ensureWorkspace(workspaceId: string): Promise<string> {
  const dir = path.join(WORKSPACES_ROOT, workspaceId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function getWorkspacePath(workspaceId: string): string {
  return path.join(WORKSPACES_ROOT, workspaceId);
}

export function resolveWorkspacePath(
  workspaceId: string,
  filePath: string
): string {
  const workspace = path.join(WORKSPACES_ROOT, workspaceId);
  // Normalize and resolve relative to workspace
  const resolved = path.resolve(workspace, filePath);
  // Prevent path traversal
  if (!resolved.startsWith(workspace + path.sep) && resolved !== workspace) {
    throw new Error("Path traversal detected: access denied");
  }
  return resolved;
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const dir = path.join(WORKSPACES_ROOT, workspaceId);
  if (!dir.startsWith(WORKSPACES_ROOT)) return;
  await fs.rm(dir, { recursive: true, force: true });
}
