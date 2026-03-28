// Client-safe module - no Node.js imports
// Policy evaluation happens server-side; this provides display helpers

export type RiskLevel = "low" | "medium" | "high";
export type PolicyLevel = "auto_approve" | "always_ask" | "conditional";

export interface ClientToolPolicy {
  toolName: string;
  policy: PolicyLevel;
  conditions: { field: string; operator: string; value: string }[];
}

// Risk classification for display
export const TOOL_RISK: Record<string, RiskLevel> = {
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

export const TOOL_META: Record<string, { icon: string; label: string; description: string }> = {
  fileRead: { icon: "📄", label: "Read File", description: "Read file contents" },
  fileWrite: { icon: "✏️", label: "Write File", description: "Create or overwrite files" },
  fileEdit: { icon: "🔧", label: "Edit File", description: "Replace text in files" },
  bash: { icon: "💻", label: "Bash", description: "Execute shell commands" },
  glob: { icon: "🔍", label: "Glob", description: "Search files by pattern" },
  grep: { icon: "🔎", label: "Grep", description: "Search file contents" },
  spawnAgent: { icon: "🤖", label: "Spawn Agent", description: "Launch sub-agents" },
  memoryRead: { icon: "🧠", label: "Memory Read", description: "Read persistent memory" },
  memoryWrite: { icon: "🧠", label: "Memory Write", description: "Write persistent memory" },
};

export const ALL_TOOL_NAMES = Object.keys(TOOL_META);

// Fallback check (used when no policy data loaded yet)
const ALWAYS_SAFE = new Set(["fileRead", "glob", "grep", "memoryRead"]);

export function requiresApproval(toolName: string): boolean {
  return !ALWAYS_SAFE.has(toolName);
}

export function requiresApprovalWithPolicy(
  toolName: string,
  args: Record<string, unknown>,
  policies: ClientToolPolicy[]
): boolean {
  const policy = policies.find((p) => p.toolName === toolName);
  if (!policy) return requiresApproval(toolName);
  if (policy.policy === "auto_approve") return false;
  if (policy.policy === "always_ask") return true;
  if (policy.policy === "conditional" && policy.conditions.length > 0) {
    for (const cond of policy.conditions) {
      const val = String(args[cond.field] || "").toLowerCase();
      const target = cond.value.toLowerCase();
      if (cond.operator === "contains" && val.includes(target)) return true;
      if (cond.operator === "starts_with" && val.startsWith(target)) return true;
      if (cond.operator === "matches_regex") {
        try { if (new RegExp(cond.value, "i").test(val)) return true; } catch { /* ignore */ }
      }
    }
    return false;
  }
  return requiresApproval(toolName);
}

export function getRiskLevel(toolName: string): RiskLevel {
  return TOOL_RISK[toolName] || "medium";
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case "high": return "text-red-400";
    case "medium": return "text-yellow-400";
    case "low": return "text-green-400";
  }
}

export function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case "high": return "bg-red-500/10 border-red-500/20";
    case "medium": return "bg-yellow-500/10 border-yellow-500/20";
    case "low": return "bg-green-500/10 border-green-500/20";
  }
}

export function getRiskIcon(level: RiskLevel): string {
  switch (level) {
    case "high": return "🔴";
    case "medium": return "🟡";
    case "low": return "🟢";
  }
}
