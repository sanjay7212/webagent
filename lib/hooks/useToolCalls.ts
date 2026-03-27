"use client";

import { useMemo } from "react";
import type { UIMessage } from "ai";

export interface ToolCallEntry {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: string; // "call" | "partial-call" | "result"
  result?: unknown;
  messageId: string;
  index: number;
}

export interface ToolCallStats {
  total: number;
  byTool: Record<string, number>;
  byStatus: { running: number; done: number; pending: number };
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
          };
          entries.push({
            toolCallId: toolPart.toolCallId,
            toolName: toolPart.toolName || part.type.replace("tool-", ""),
            args: (toolPart.input as Record<string, unknown>) || {},
            state: toolPart.state,
            result: toolPart.output,
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

    for (const tc of toolCalls) {
      byTool[tc.toolName] = (byTool[tc.toolName] || 0) + 1;
      if (tc.state === "result") done++;
      else if (tc.state === "call") pending++;
      else running++;
    }

    return { total: toolCalls.length, byTool, byStatus: { running, done, pending } };
  }, [toolCalls]);

  return { toolCalls, stats };
}
