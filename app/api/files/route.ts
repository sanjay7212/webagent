import { NextResponse } from "next/server";
import { getWorkspacePath } from "@/lib/sandbox/workspace";
import fs from "fs/promises";
import path from "path";
import type { FileTreeNode } from "@/lib/types";

async function buildFileTree(
  dirPath: string,
  basePath: string = ""
): Promise<FileTreeNode[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nodes: FileTreeNode[] = [];

  for (const entry of entries) {
    // Skip hidden files and node_modules
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;

    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const children = await buildFileTree(
        path.join(dirPath, entry.name),
        relativePath
      );
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: "directory",
        children,
      });
    } else {
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: "file",
      });
    }
  }

  // Sort: directories first, then alphabetical
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId is required" },
      { status: 400 }
    );
  }

  const workspace = getWorkspacePath(workspaceId);

  try {
    const tree = await buildFileTree(workspace);
    return NextResponse.json(tree);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
