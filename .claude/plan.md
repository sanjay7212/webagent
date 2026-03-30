# Tool Approval Policy System - Implementation Plan

## Overview
Build a configurable tool approval policy system with three layers:
1. **Policy Configuration UI** — settings panel to define per-tool approval rules
2. **Live Approval Drawer** — inline approval/rejection during agent execution
3. **Audit Trail** — tool call history with policy attribution

## Architecture

### Data Model

**New: `tool_policies` table in SQLite**
```
tool_policies:
  toolName: text (primary key) — e.g., "bash", "fileWrite"
  policy: text — "auto_approve" | "always_ask" | "conditional"
  conditions: text (JSON, nullable) — e.g., {"pathContains": ".env", "commandContains": "rm"}
  updatedAt: timestamp
```

**Presets stored in code (not DB):**
- Permissive: all auto-approve except bash
- Balanced: reads auto-approve, writes ask-always
- Strict: everything ask-always (learning mode)

### Files to Create

1. **`components/chat/ToolPolicyPanel.tsx`** — Settings tab showing per-tool policy config
   - Table: tool name | icon | policy dropdown | conditions editor
   - Three preset buttons at top (Permissive / Balanced / Strict)
   - Conditional rules: simple text-match fields (path contains, command contains)

2. **`lib/hooks/useToolPolicies.ts`** — Hook for CRUD on tool policies
   - `policies` state, `updatePolicy()`, `applyPreset()`, `getPolicy(toolName)`

3. **`app/api/tool-policies/route.ts`** — API for reading/writing policies
   - GET: return all policies
   - PUT: update a single policy
   - POST: apply a preset (bulk update)

### Files to Modify

4. **`lib/db/schema.ts`** — Add `toolPolicies` table

5. **`lib/tools/permissions.ts`** — Replace hardcoded `AUTO_APPROVED_TOOLS` with DB-backed policy check
   - `requiresApproval(toolName, args?)` now checks DB + evaluates conditions
   - Export `getToolPolicy(toolName)` for UI consumption

6. **`components/chat/ToolCallBlock.tsx`** — Update approval UI
   - Show which policy triggered the approval request
   - Add "Approve & Remember" button (auto-approves similar future calls)
   - Show risk indicator (red for destructive, yellow for write, green for read)

7. **`components/layout/SettingsDialog.tsx`** — Add "Tool Policies" tab
   - Embed `ToolPolicyPanel` as a new tab alongside existing provider status

8. **`app/api/chat/route.ts`** — Pass policy context to tool execution
   - Load policies at request start
   - Pass to tool wrappers for conditional evaluation

9. **`components/chat/ToolCallPanel.tsx`** — Add policy attribution column
   - Each tool call shows: "Auto-approved (Balanced preset)" or "Approved by user" or "Denied by user"

10. **`app/page.tsx`** — Add toolbar button to open policy panel inline (not just in settings)

### Approval Flow (Updated)

```
1. Agent calls tool (e.g., bash with "rm -rf tmp")
2. Server checks policy for "bash":
   - auto_approve → execute immediately
   - always_ask → pause, send approval request to client
   - conditional → evaluate conditions:
     - If condition matches (e.g., command contains "rm") → pause for approval
     - If no condition matches → auto-approve
3. Client shows approval drawer with:
   - Tool name, args, risk level
   - Policy that triggered it
   - [Approve] [Reject] [Approve & Remember]
4. "Approve & Remember" → adds new conditional auto-approve rule
5. Result logged to audit trail in ToolCallPanel
```

### Risk Classification (Display Only)
- 🔴 **High**: bash (with rm/sudo/chmod), fileWrite to .env/credentials
- 🟡 **Medium**: fileWrite, fileEdit, spawnAgent, memoryWrite
- 🟢 **Low**: fileRead, glob, grep, memoryRead

### UI Layout

**In SettingsDialog (new tab):**
```
[Providers] [Tool Policies]

Presets: [Permissive] [Balanced ✓] [Strict]

┌──────────┬──────────────┬────────────────┐
│ Tool     │ Policy       │ Conditions     │
├──────────┼──────────────┼────────────────┤
│ 💻 bash  │ [Always Ask ▾]│ [+ Add Rule]  │
│ 📄 read  │ [Auto ▾]     │               │
│ ✏️ write │ [Ask If... ▾] │ path has .env │
│ 🔧 edit  │ [Ask If... ▾] │ path has .env │
│ 🔍 glob  │ [Auto ▾]     │               │
│ 🔎 grep  │ [Auto ▾]     │               │
│ 🤖 agent │ [Always Ask ▾]│               │
│ 🧠 mem-w │ [Auto ▾]     │               │
│ 🧠 mem-r │ [Auto ▾]     │               │
└──────────┴──────────────┴────────────────┘
```

**In ToolCallPanel (updated entries):**
```
💻 bash — ls -la          ✓ done
  Policy: Auto-approved (Balanced)

✏️ fileWrite — config.json  ⏳ pending
  Policy: Awaiting approval (path contains .json)
  [✅ Approve] [❌ Reject] [✅ Approve & Remember]
```

## Implementation Order

1. DB schema + migration (tool_policies table)
2. API route for policies CRUD
3. Update permissions.ts to be DB-backed
4. useToolPolicies hook
5. ToolPolicyPanel component
6. Add tab to SettingsDialog
7. Update ToolCallBlock with risk indicators + policy attribution
8. Update ToolCallPanel with audit info
9. "Approve & Remember" functionality
10. Presets (Permissive/Balanced/Strict)
