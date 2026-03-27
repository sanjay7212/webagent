import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conversations } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ensureWorkspace } from "@/lib/sandbox/workspace";

export async function GET() {
  const result = await db
    .select()
    .from(conversations)
    .orderBy(desc(conversations.updatedAt));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = nanoid();
  const workspaceId = nanoid(10);
  const now = new Date();

  await ensureWorkspace(workspaceId);

  const conv = {
    id,
    title: body.title || "New conversation",
    model: body.model || null,
    workspaceId,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(conversations).values(conv);

  return NextResponse.json(conv, { status: 201 });
}
