import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { deleteWorkspace } from "@/lib/sandbox/workspace";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, id),
  });

  if (!conv) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(conv);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title) updates.title = body.title;
  if (body.model) updates.model = body.model;

  await db
    .update(conversations)
    .set(updates)
    .where(eq(conversations.id, id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const conv = await db.query.conversations.findFirst({
    where: eq(conversations.id, id),
  });

  if (conv) {
    // Delete messages first (cascade should handle, but be explicit)
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
    await deleteWorkspace(conv.workspaceId);
  }

  return NextResponse.json({ ok: true });
}
