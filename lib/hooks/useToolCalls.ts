"use client";

import { useMemo } from "react";
import type { UIMessage } from "ai";

// AI SDK v6 tool invocation states:
// "input-streaming"    → tool call is streaming input params
// "input-available"    → input ready, tool is executing
// "approval-requested" → waiting for user approval
// "approval-responded" → approval given, tool executing
// "output-available"   → tool completed successfully
// "output-error"       → tool errored

export type ToolCallState = "running" | "done" | "pending" | "error";

export interface ToolCallEntry {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  rawState: string;      // original SDK state
  state: ToolCallState;  // normalized for display
  result?: unknown;
  errorText?: string;
  messageId: string;
  index: number;
}

export interface ToolCallStats {
  total: number;
  byTool: Record<string, number>;
  byStatus: { running: number; done: number; pending: number; error: number };
}

function normalizeState(sdkState: string): ToolCallState {
  switch (sdkState) {
    case "output-available":
      return "done";
    case "output-error":
      return "error";
    case "approval-requested":
      return "pending";
    case "input-streaming":
    case "input-available":
    case "approval-responded":
      return "running";
    // Legacy states (AI SDK v5 compat)
    case "result":
      return "done";
    case "call":
      return "pending";
    default:
      return "running";
  }
}

export function useToolCalls(messages: UIMessage[]) {
  const toolCalls = useMemo(() => {
    const entries: ToolCallEntry[] = [];
    let index = 0;

    for (const message of messages) {
      for (const part of message.parts) {
        if (
          part.type === "dynamic-tool" ||
          part.type.startsWith("tool-")
        ) {
          const toolPart = part as {
            type: string;
            toolName?: string;
            toolCallId: string;
            state: string;
            input?: Record<string, unknown>;
            output?: unknown;
            errorText?: string;
          };
          entries.push({
            toolCallId: toolPart.toolCallId,
            toolName: toolPart.toolName || part.type.replace("tool-", ""),
            args: (toolPart.input as Record<string, unknown>) || {},
            rawState: toolPart.state,
            state: normalizeState(toolPart.state),
            result: toolPart.output,
            errorText: toolPart.errorText,
            messageId: message.id,
            index: index++,
          });
        }
      }
    }

    return entries;
  }, [messages]);

  const stats = useMemo<ToolCallStats>(() => {
    const byTool: Record<string, number> = {};
    let running = 0;
    let done = 0;
    let pending = 0;
    let error = 0;

    for (const tc of toolCalls) {
      byTool[tc.toolName] = (byTool[tc.toolName] || 0) + 1;
      switch (tc.state) {
        case "done": done++; break;
        case "pending": pending++; break;
        case "error": error++; break;
        default: running++; break;
      }
    }

    return { total: toolCalls.length, byTool, byStatus: { running, done, pending, error } };
  }, [toolCalls]);

  return { toolCalls, stats };
}
