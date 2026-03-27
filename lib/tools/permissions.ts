// Client-safe module - no Node.js imports

export const AUTO_APPROVED_TOOLS = new Set(["fileRead", "glob", "grep", "memoryRead"]);

export function requiresApproval(toolName: string): boolean {
  return !AUTO_APPROVED_TOOLS.has(toolName);
}
