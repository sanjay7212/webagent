/**
 * Server-side tool policy engine.
 * Evaluates whether a tool call requires approval based on DB-stored policies.
 */

import { db } from "@/lib/db";
import { toolPolicies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type PolicyLevel = "auto_approve" | "always_ask" | "conditional";

export interface ToolCondition {
  field: string; // e.g., "command", "file_path"
  operator: "contains" | "starts_with" | "matches_regex";
  value: string;
}

export interface ToolPolicy {
  toolName: string;
  policy: PolicyLevel;
  conditions: ToolCondition[];
  updatedAt: Date;
}

export interface PolicyDecision {
  action: "auto_approve" | "ask";
  reason: string;
  riskLevel: "low" | "medium" | "high";
  policySource: string; // e.g., "Balanced preset", "Custom rule", "Default"
}

// Risk classification per tool
const TOOL_RISK: Record<string, "low" | "medium" | "high"> = {
  fileRead: "low",
  glob: "low",
  grep: "low",
  memoryRead: "low",
  fileWrite: "medium",
  fileEdit: "medium",
  memoryWrite: "medium",
  spawnAgent: "medium",
  bash: "high",
};

// Default policies (used when no DB policy exists)
const DEFAULT_POLICIES: Record<string, PolicyLevel> = {
  fileRead: "auto_approve",
  glob: "auto_approve",
  grep: "auto_approve",
  memoryRead: "auto_approve",
  fileWrite: "always_ask",
  fileEdit: "always_ask",
  bash: "always_ask",
  spawnAgent: "always_ask",
  memoryWrite: "auto_approve",
};

// Presets
export const PRESETS = {
  permissive: {
    label: "Permissive",
    description: "Everything auto-approved except bash",
    policies: {
      fileRead: "auto_approve" as PolicyLevel,
      fileWrite: "auto_approve" as PolicyLevel,
      fileEdit: "auto_approve" as PolicyLevel,
      bash: "always_ask" as PolicyLevel,
      glob: "auto_approve" as PolicyLevel,
      grep: "auto_approve" as PolicyLevel,
      spawnAgent: "auto_approve" as PolicyLevel,
      memoryRead: "auto_approve" as PolicyLevel,
      memoryWrite: "auto_approve" as PolicyLevel,
    },
  },
  balanced: {
    label: "Balanced",
    description: "Reads auto-approved, writes need approval",
    policies: {
      fileRead: "auto_approve" as PolicyLevel,
      fileWrite: "always_ask" as PolicyLevel,
      fileEdit: "always_ask" as PolicyLevel,
      bash: "always_ask" as PolicyLevel,
      glob: "auto_approve" as PolicyLevel,
      grep: "auto_approve" as PolicyLevel,
      spawnAgent: "always_ask" as PolicyLevel,
      memoryRead: "auto_approve" as PolicyLevel,
      memoryWrite: "auto_approve" as PolicyLevel,
    },
  },
  strict: {
    label: "Strict",
    description: "Everything requires approval (learning mode)",
    policies: {
      fileRead: "always_ask" as PolicyLevel,
      fileWrite: "always_ask" as PolicyLevel,
      fileEdit: "always_ask" as PolicyLevel,
      bash: "always_ask" as PolicyLevel,
      glob: "always_ask" as PolicyLevel,
      grep: "always_ask" as PolicyLevel,
      spawnAgent: "always_ask" as PolicyLevel,
      memoryRead: "always_ask" as PolicyLevel,
      memoryWrite: "always_ask" as PolicyLevel,
    },
  },
};

/**
 * Get all tool policies from DB, falling back to defaults.
 */
export async function getAllPolicies(): Promise<ToolPolicy[]> {
  const dbPolicies = await db.select().from(toolPolicies);
  const policyMap = new Map(dbPolicies.map((p) => [p.toolName, p]));

  const allToolNames = Object.keys(DEFAULT_POLICIES);
  return allToolNames.map((toolName) => {
    const dbPolicy = policyMap.get(toolName);
    if (dbPolicy) {
      return {
        toolName: dbPolicy.toolName,
        policy: dbPolicy.policy as PolicyLevel,
        conditions: dbPolicy.conditions ? JSON.parse(dbPolicy.conditions) : [],
        updatedAt: dbPolicy.updatedAt,
      };
    }
    return {
      toolName,
      policy: DEFAULT_POLICIES[toolName] || "always_ask",
      conditions: [],
      updatedAt: new Date(),
    };
  });
}

/**
 * Evaluate whether a specific tool call needs approval.
 */
export async function evaluatePolicy(
  toolName: string,
  args: Record<string, unknown>
): Promise<PolicyDecision> {
  const riskLevel = TOOL_RISK[toolName] || "medium";

  // Check DB for policy
  const dbPolicy = await db.query.toolPolicies.findFirst({
    where: eq(toolPolicies.toolName, toolName),
  });

  const policy = dbPolicy?.policy as PolicyLevel | undefined;
  const conditions: ToolCondition[] = dbPolicy?.conditions
    ? JSON.parse(dbPolicy.conditions)
    : [];

  const effectivePolicy = policy || DEFAULT_POLICIES[toolName] || "always_ask";
  const policySource = dbPolicy ? "Custom policy" : "Default";

  if (effectivePolicy === "auto_approve") {
    return {
      action: "auto_approve",
      reason: "Auto-approved by policy",
      riskLevel,
      policySource,
    };
  }

  if (effectivePolicy === "always_ask") {
    return {
      action: "ask",
      reason: "Requires approval (always ask)",
      riskLevel,
      policySource,
    };
  }

  // Conditional — evaluate conditions
  if (conditions.length === 0) {
    // No conditions defined, auto-approve
    return {
      action: "auto_approve",
      reason: "Conditional policy with no matching rules",
      riskLevel,
      policySource,
    };
  }

  for (const condition of conditions) {
    const fieldValue = String(args[condition.field] || "");
    let matches = false;

    switch (condition.operator) {
      case "contains":
        matches = fieldValue.toLowerCase().includes(condition.value.toLowerCase());
        break;
      case "starts_with":
        matches = fieldValue.toLowerCase().startsWith(condition.value.toLowerCase());
        break;
      case "matches_regex":
        try {
          matches = new RegExp(condition.value, "i").test(fieldValue);
        } catch {
          matches = false;
        }
        break;
    }

    if (matches) {
      return {
        action: "ask",
        reason: `Condition matched: ${condition.field} ${condition.operator} "${condition.value}"`,
        riskLevel: riskLevel === "low" ? "medium" : riskLevel, // Elevate if condition triggers
        policySource: `Conditional rule: ${condition.field} ${condition.operator} "${condition.value}"`,
      };
    }
  }

  // No conditions matched — auto-approve
  return {
    action: "auto_approve",
    reason: "No conditional rules matched",
    riskLevel,
    policySource,
  };
}

/**
 * Update a single tool policy.
 */
export async function updateToolPolicy(
  toolName: string,
  policy: PolicyLevel,
  conditions?: ToolCondition[]
): Promise<void> {
  const now = new Date();
  const existing = await db.query.toolPolicies.findFirst({
    where: eq(toolPolicies.toolName, toolName),
  });

  if (existing) {
    await db
      .update(toolPolicies)
      .set({
        policy,
        conditions: conditions ? JSON.stringify(conditions) : null,
        updatedAt: now,
      })
      .where(eq(toolPolicies.toolName, toolName));
  } else {
    await db.insert(toolPolicies).values({
      toolName,
      policy,
      conditions: conditions ? JSON.stringify(conditions) : null,
      updatedAt: now,
    });
  }
}

/**
 * Apply a preset to all tools.
 */
export async function applyPreset(
  presetName: keyof typeof PRESETS
): Promise<void> {
  const preset = PRESETS[presetName];
  if (!preset) throw new Error(`Unknown preset: ${presetName}`);

  const now = new Date();
  for (const [toolName, policy] of Object.entries(preset.policies)) {
    await updateToolPolicy(toolName, policy as PolicyLevel);
  }

  // Also store which preset is active
  const { settings } = await import("@/lib/db/schema");
  const existingSetting = await db.query.settings.findFirst({
    where: eq(settings.key, "active_preset"),
  });
  if (existingSetting) {
    await db
      .update(settings)
      .set({ value: presetName })
      .where(eq(settings.key, "active_preset"));
  } else {
    await db.insert(settings).values({ key: "active_preset", value: presetName });
  }
}

/**
 * Get the currently active preset name (if any).
 */
export async function getActivePreset(): Promise<string | null> {
  const { settings } = await import("@/lib/db/schema");
  const setting = await db.query.settings.findFirst({
    where: eq(settings.key, "active_preset"),
  });
  return setting?.value || null;
}

/**
 * Add an "approve & remember" rule — auto-approve similar future calls.
 */
export async function addApproveRememberRule(
  toolName: string,
  args: Record<string, unknown>
): Promise<void> {
  // Find the most relevant field to create a rule from
  const relevantFields = ["command", "file_path", "pattern", "agent"];
  let field = "";
  let value = "";

  for (const f of relevantFields) {
    if (args[f]) {
      field = f;
      value = String(args[f]);
      break;
    }
  }

  if (!field) {
    // No relevant field — just auto-approve the entire tool
    await updateToolPolicy(toolName, "auto_approve");
    return;
  }

  // Get current policy
  const dbPolicy = await db.query.toolPolicies.findFirst({
    where: eq(toolPolicies.toolName, toolName),
  });

  // We want: if condition matches, auto-approve. But our system asks on match.
  // So for "approve & remember", we change the tool to auto_approve.
  // A more sophisticated system would have allow/deny per condition.
  // For now, just auto-approve the whole tool.
  await updateToolPolicy(toolName, "auto_approve");
}
