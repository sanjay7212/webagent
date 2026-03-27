import { NextResponse } from "next/server";
import { resolveApproval } from "@/lib/agent/permissions";

export async function POST(req: Request) {
  const { toolCallId, approved } = await req.json();

  if (!toolCallId || typeof approved !== "boolean") {
    return NextResponse.json(
      { error: "toolCallId and approved are required" },
      { status: 400 }
    );
  }

  const resolved = resolveApproval(toolCallId, approved);

  return NextResponse.json({ ok: resolved });
}
