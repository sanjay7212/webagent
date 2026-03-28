import { NextResponse } from "next/server";
import {
  getAllPolicies,
  updateToolPolicy,
  applyPreset,
  getActivePreset,
  addApproveRememberRule,
  PRESETS,
} from "@/lib/tools/policy-engine";
import type { PolicyLevel, ToolCondition } from "@/lib/tools/policy-engine";

// GET - list all policies
export async function GET() {
  try {
    const policies = await getAllPolicies();
    const activePreset = await getActivePreset();
    return NextResponse.json({
      policies,
      activePreset,
      presets: Object.entries(PRESETS).map(([key, val]) => ({
        id: key,
        label: val.label,
        description: val.description,
      })),
    });
  } catch (error) {
    console.error("[tool-policies] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load policies" },
      { status: 500 }
    );
  }
}

// PUT - update a single policy or apply preset
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    if (body.preset) {
      // Apply a preset
      await applyPreset(body.preset);
      const policies = await getAllPolicies();
      return NextResponse.json({ ok: true, policies, activePreset: body.preset });
    }

    if (body.approveRemember) {
      // "Approve & Remember" action
      await addApproveRememberRule(body.toolName, body.args || {});
      const policies = await getAllPolicies();
      return NextResponse.json({ ok: true, policies });
    }

    // Update a single tool policy
    const { toolName, policy, conditions } = body as {
      toolName: string;
      policy: PolicyLevel;
      conditions?: ToolCondition[];
    };

    if (!toolName || !policy) {
      return NextResponse.json(
        { error: "toolName and policy are required" },
        { status: 400 }
      );
    }

    await updateToolPolicy(toolName, policy, conditions);

    // Clear the active preset since user customized
    const { settings } = await import("@/lib/db/schema");
    const { db } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const existing = await db.query.settings.findFirst({
      where: eq(settings.key, "active_preset"),
    });
    if (existing) {
      await db
        .update(settings)
        .set({ value: "custom" })
        .where(eq(settings.key, "active_preset"));
    }

    const policies = await getAllPolicies();
    return NextResponse.json({ ok: true, policies });
  } catch (error) {
    console.error("[tool-policies] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update policy" },
      { status: 500 }
    );
  }
}
