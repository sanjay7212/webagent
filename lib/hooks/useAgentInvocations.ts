"use client";

import { useMemo } from "react";
import type { UIMessage } from "ai";

export interface AgentTokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface AgentInvocation {
  id: string;
  agent: string; // "main", "explorer", "planner"
  task: string;
  status: "running" | "done" | "error";
  steps: number;
  tools: string[];
  toolCallCount: number;
  estimatedTokens: AgentTokenUsage;
  resultPreview?: string;
}

export interface AgentStats {
  totalInvocations: number;
  totalToolCalls: number;
  totalTokens: number;
  byAgent: Record<string, number>;
}

const AGENT_META_DELIMITER = "\n---AGENT_META---\n";

function parseAgentMeta(resultStr: string): {
  text: string;
  meta: Record<string, unknown> | null;
} {
  const idx = resultStr.indexOf(AGENT_META_DELIMITER);
  if (idx === -1) return { text: resultStr, meta: null };
  const text = resultStr.slice(0, idx);
  try {
    const meta = JSON.parse(resultStr.slice(idx + AGENT_META_DELIMITER.length));
    return { text, meta };
  } catch {
    return { text: resultStr, meta: null };
  }
}

export function useAgentInvocations(messages: UIMessage[]) {
  const invocations = useMemo(() => {
    const result: AgentInvocation[] = [];

    // Track main agent stats
    let mainToolCallCount = 0;
    let mainToolsUsed = new Set<string>();
    let mainInputChars = 0;
    let mainOutputChars = 0;
    let mainSteps = 0;
    let hasAnyAssistantMsg = false;

    for (const message of messages) {
      if (message.role === "user") {
        for (const part of message.parts) {
          if (part.type === "text") {
            mainInputChars += (part as { text: string }).text.length;
          }
        }
      }

      if (message.role === "assistant") {
        hasAnyAssistantMsg = true;
        mainSteps++;

        for (const part of message.parts) {
          if (part.type === "text") {
            mainOutputChars += (part as { text: string }).text.length;
          }

          // Check for tool invocations
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
            const toolName =
              toolPart.toolName || part.type.replace("tool-", "");

            if (toolName !== "spawnAgent") {
              mainToolCallCount++;
              mainToolsUsed.add(toolName);
            }

            // Parse spawnAgent invocations
            if (toolName === "spawnAgent") {
              const args = (toolPart.input || {}) as {
                agent?: string;
                task?: string;
              };
              const agentName = args.agent || "unknown";
              const task = args.task || "";

              if (toolPart.state === "result" && toolPart.output) {
                const outputStr =
                  typeof toolPart.output === "string"
                    ? toolPart.output
                    : JSON.stringify(toolPart.output);
                const { text, meta } = parseAgentMeta(outputStr);

                if (meta) {
                  result.push({
                    id: toolPart.toolCallId,
                    agent: agentName,
                    task,
                    status: "done",
                    steps: (meta.steps as number) || 1,
                    tools: (meta.tools as string[]) || [],
                    toolCallCount: (meta.toolCallCount as number) || 0,
                    estimatedTokens: (meta.estimatedTokens as AgentTokenUsage) || {
                      prompt: 0,
                      completion: 0,
                      total: 0,
                    },
                    resultPreview: text.slice(0, 200),
                  });
                } else {
                  // No metadata — estimate
                  result.push({
                    id: toolPart.toolCallId,
                    agent: agentName,
                    task,
                    status: outputStr.startsWith("Sub-agent error")
                      ? "error"
                      : "done",
                    steps: 1,
                    tools: [],
                    toolCallCount: 0,
                    estimatedTokens: {
                      prompt: Math.ceil(task.length / 4),
                      completion: Math.ceil(outputStr.length / 4),
                      total: Math.ceil((task.length + outputStr.length) / 4),
                    },
                    resultPreview: outputStr.slice(0, 200),
                  });
                }
              } else {
                // Still running
                result.push({
                  id: toolPart.toolCallId,
                  agent: agentName,
                  task,
                  status: "running",
                  steps: 0,
                  tools: [],
                  toolCallCount: 0,
                  estimatedTokens: { prompt: 0, completion: 0, total: 0 },
                });
              }
            }
          }
        }
      }
    }

    // Add main agent as first entry if there's any activity
    if (hasAnyAssistantMsg) {
      result.unshift({
        id: "main",
        agent: "main",
        task: "User request",
        status: messages.some(
          (m) =>
            m.role === "assistant" &&
            m.parts.some(
              (p) =>
                (p.type === "dynamic-tool" || p.type.startsWith("tool-")) &&
                (p as any).state !== "result"
            )
        )
          ? "running"
          : "done",
        steps: mainSteps,
        tools: Array.from(mainToolsUsed),
        toolCallCount: mainToolCallCount,
        estimatedTokens: {
          prompt: Math.ceil(mainInputChars / 4),
          completion: Math.ceil(mainOutputChars / 4),
          total: Math.ceil((mainInputChars + mainOutputChars) / 4),
        },
      });
    }

    return result;
  }, [messages]);

  const stats = useMemo<AgentStats>(() => {
    let totalToolCalls = 0;
    let totalTokens = 0;
    const byAgent: Record<string, number> = {};

    for (const inv of invocations) {
      totalToolCalls += inv.toolCallCount;
      totalTokens += inv.estimatedTokens.total;
      byAgent[inv.agent] = (byAgent[inv.agent] || 0) + 1;
    }

    return {
      totalInvocations: invocations.length,
      totalToolCalls,
      totalTokens,
      byAgent,
    };
  }, [invocations]);

  return { invocations, stats };
}
