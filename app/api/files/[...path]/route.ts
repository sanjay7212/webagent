import { NextResponse } from "next/server";
import { resolveWorkspacePath } from "@/lib/sandbox/workspace";
import fs from "fs/promises";
import path from "path";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const { path: pathSegments } = await params;

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId is required" },
      { status: 400 }
    );
  }

  const filePath = pathSegments.join("/");

  try {
    const resolved = resolveWorkspacePath(workspaceId, filePath);
    const content = await fs.readFile(resolved, "utf-8");
    return NextResponse.json({ path: filePath, content });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to read file" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const { path: pathSegments } = await params;

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId is required" },
      { status: 400 }
    );
  }

  const filePath = pathSegments.join("/");
  const body = await req.json();

  try {
    const resolved = resolveWorkspacePath(workspaceId, filePath);
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, body.content, "utf-8");
    return NextResponse.json({ ok: true, path: filePath });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json(
      { error: error.message || "Failed to write file" },
      { status: 500 }
    );
  }
}
