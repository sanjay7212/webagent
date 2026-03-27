import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(settings);
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    try {
      result[row.key] = JSON.parse(row.value);
    } catch {
      result[row.key] = row.value;
    }
  }
  return NextResponse.json(result);
}

export async function PUT(req: Request) {
  const body = await req.json();

  for (const [key, value] of Object.entries(body)) {
    const stringValue = JSON.stringify(value);
    await db
      .insert(settings)
      .values({ key, value: stringValue })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: stringValue },
      });
  }

  return NextResponse.json({ ok: true });
}
