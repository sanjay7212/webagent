"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  useAgentInvocations,
  type AgentInvocation,
} from "@/lib/hooks/useAgentInvocations";
import type { UIMessage } from "ai";

const agentIcons: Record<string, string> = {
  main: "🎯",
  explorer: "🔍",
  planner: "📋",
  unknown: "🤖",
};

const agentColors: Record<string, string> = {
  main: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10",
  explorer: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  planner: "text-amber-400 border-amber-400/30 bg-amber-400/10",
};

function StatusDot({ status }: { status: string }) {
  if (status === "done")
    return <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />;
  if (status === "error")
    return <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />;
  return (
    <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 animate-pulse" />
  );
}

function AgentCard({
  invocation,
  isSubAgent,
}: {
  invocation: AgentInvocation;
  isSubAgent: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const color =
    agentColors[invocation.agent] || "text-zinc-400 border-zinc-600 bg-zinc-800";
  const icon = agentIcons[invocation.agent] || "🤖";

  return (
    <div
      className={`rounded-lg border border-zinc-700/50 bg-zinc-800/40 overflow-hidden ${
        isSubAgent ? "ml-4" : ""
      }`}
    >
      <button
        className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-zinc-700/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <StatusDot status={invocation.status} />
        <span className="text-sm">{icon}</span>
        <Badge variant="outline" className={`text-xs ${color}`}>
          {invocation.agent}
        </Badge>

        {/* Key metrics inline */}
        <div className="flex gap-2 ml-auto text-xs text-zinc-500 font-mono shrink-0">
          {invocation.steps > 0 && (
            <span>{invocation.steps} step{invocation.steps > 1 ? "s" : ""}</span>
          )}
          {invocation.toolCallCount > 0 && (
            <span>{invocation.toolCallCount} calls</span>
          )}
          {invocation.estimatedTokens.total > 0 && (
            <span className="text-zinc-400">
              ~{invocation.estimatedTokens.total.toLocaleString()} tok
            </span>
          )}
        </div>
        <span className="text-zinc-600 text-xs shrink-0">
          {expanded ? "▼" : "▶"}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-zinc-700/50 space-y-2">
          {/* Task */}
          {isSubAgent && invocation.task && (
            <div className="mt-2">
              <div className="text-xs text-zinc-500 mb-0.5">Task</div>
              <p className="text-xs text-zinc-300 bg-zinc-900 p-1.5 rounded">
                {invocation.task}
              </p>
            </div>
          )}

          {/* Tools used */}
          {invocation.tools.length > 0 && (
            <div>
              <div className="text-xs text-zinc-500 mb-0.5">Tools Used</div>
              <div className="flex flex-wrap gap-1">
                {invocation.tools.map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="text-xs bg-zinc-900 text-zinc-400 border-zinc-700"
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Token breakdown */}
          {invocation.estimatedTokens.total > 0 && (
            <div>
              <div className="text-xs text-zinc-500 mb-0.5">
                Token Usage (estimated)
              </div>
              <div className="flex gap-3 text-xs text-zinc-500 font-mono bg-zinc-900 p-1.5 rounded">
                <span>
                  in: ~{invocation.estimatedTokens.prompt.toLocaleString()}
                </span>
                <span>
                  out: ~{invocation.estimatedTokens.completion.toLocaleString()}
                </span>
                <span className="text-zinc-400">
                  total: ~{invocation.estimatedTokens.total.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Result preview for sub-agents */}
          {isSubAgent && invocation.resultPreview && (
            <div>
              <div className="text-xs text-zinc-500 mb-0.5">
                Result Preview
              </div>
              <pre className="text-xs bg-zinc-900 p-1.5 rounded overflow-auto max-h-32 whitespace-pre-wrap text-zinc-300">
                {invocation.resultPreview}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AgentPanelProps {
  messages: UIMessage[];
}

export function AgentPanel({ messages }: AgentPanelProps) {
  const { invocations, stats } = useAgentInvocations(messages);

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-700">
      {/* Header */}
      <div className="p-3 border-b border-zinc-700 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-300">
            Agent Executions
          </span>
          <Badge
            variant="outline"
            className="text-xs bg-zinc-800 text-zinc-400 border-zinc-600"
          >
            {stats.totalInvocations} agent{stats.totalInvocations !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Summary stats */}
        {stats.totalInvocations > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="text-xs bg-zinc-800 text-zinc-400 border-zinc-600 font-mono"
            >
              {stats.totalToolCalls} tool calls
            </Badge>
            <Badge
              variant="outline"
              className="text-xs bg-zinc-800 text-zinc-400 border-zinc-600 font-mono"
            >
              ~{stats.totalTokens.toLocaleString()} tokens
            </Badge>
          </div>
        )}
      </div>

      {/* Invocation list */}
      <div className="flex-1 overflow-y-auto">
        {invocations.length === 0 ? (
          <div className="p-4 text-center text-zinc-500 text-sm">
            No agent activity yet. The agent will appear here when it starts
            processing your request, including any sub-agents it spawns.
          </div>
        ) : (
          <div className="p-2 space-y-1.5">
            {invocations.map((inv) => (
              <AgentCard
                key={inv.id}
                invocation={inv}
                isSubAgent={inv.agent !== "main"}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary footer */}
      {stats.totalInvocations > 1 && (
        <div className="px-3 py-2 border-t border-zinc-700/50 bg-zinc-800/30 shrink-0">
          <div className="text-xs text-zinc-500">
            <span className="text-zinc-400 font-medium">Total across all agents: </span>
            <span className="font-mono">
              {stats.totalToolCalls} tool calls, ~
              {stats.totalTokens.toLocaleString()} tokens
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
