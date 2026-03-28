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
  main: "text-[#5ba4b5] border-[#5ba4b5]/30 bg-[#5ba4b5]/10",
  explorer: "text-cyan-600 border-cyan-600/30 bg-cyan-50",
  planner: "text-amber-600 border-amber-600/30 bg-amber-50",
};

function StatusDot({ status }: { status: string }) {
  if (status === "done")
    return <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />;
  if (status === "error")
    return <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />;
  return (
    <span className="w-2 h-2 rounded-full bg-[#5ba4b5] shrink-0 animate-pulse" />
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
    agentColors[invocation.agent] || "text-gray-500 border-gray-300 bg-gray-100";
  const icon = agentIcons[invocation.agent] || "🤖";

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-gray-50 overflow-hidden ${
        isSubAgent ? "ml-4" : ""
      }`}
    >
      <button
        className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <StatusDot status={invocation.status} />
        <span className="text-sm">{icon}</span>
        <Badge variant="outline" className={`text-xs ${color}`}>
          {invocation.agent}
        </Badge>

        {/* Key metrics inline */}
        <div className="flex gap-2 ml-auto text-xs text-gray-500 font-mono shrink-0">
          {invocation.steps > 0 && (
            <span>{invocation.steps} step{invocation.steps > 1 ? "s" : ""}</span>
          )}
          {invocation.toolCallCount > 0 && (
            <span>{invocation.toolCallCount} calls</span>
          )}
          {invocation.estimatedTokens.total > 0 && (
            <span className="text-gray-500">
              ~{invocation.estimatedTokens.total.toLocaleString()} tok
            </span>
          )}
        </div>
        <span className="text-gray-400 text-xs shrink-0">
          {expanded ? "▼" : "▶"}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-200 space-y-2">
          {/* Task */}
          {isSubAgent && invocation.task && (
            <div className="mt-2">
              <div className="text-xs text-gray-500 mb-0.5">Task</div>
              <p className="text-xs text-gray-700 bg-white p-1.5 rounded">
                {invocation.task}
              </p>
            </div>
          )}

          {/* Tools used */}
          {invocation.tools.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Tools Used</div>
              <div className="flex flex-wrap gap-1">
                {invocation.tools.map((t) => (
                  <Badge
                    key={t}
                    variant="outline"
                    className="text-xs bg-white text-gray-500 border-gray-200"
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
              <div className="text-xs text-gray-500 mb-0.5">
                Token Usage (estimated)
              </div>
              <div className="flex gap-3 text-xs text-gray-500 font-mono bg-white p-1.5 rounded">
                <span>
                  in: ~{invocation.estimatedTokens.prompt.toLocaleString()}
                </span>
                <span>
                  out: ~{invocation.estimatedTokens.completion.toLocaleString()}
                </span>
                <span className="text-gray-500">
                  total: ~{invocation.estimatedTokens.total.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Result preview for sub-agents */}
          {isSubAgent && invocation.resultPreview && (
            <div>
              <div className="text-xs text-gray-500 mb-0.5">
                Result Preview
              </div>
              <pre className="text-xs bg-white p-1.5 rounded overflow-auto max-h-32 whitespace-pre-wrap text-gray-700">
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

const AVAILABLE_AGENTS = [
  {
    name: "main",
    icon: "🎯",
    label: "Default Agent",
    description: "General-purpose agent for executing tasks, writing files, and running commands",
    tools: ["fileRead", "fileWrite", "fileEdit", "bash", "glob", "grep", "memoryRead", "memoryWrite", "spawnAgent"],
  },
  {
    name: "explorer",
    icon: "🔍",
    label: "Explorer Agent",
    description: "Research and discovery — finds files, searches content, gathers information",
    tools: ["fileRead", "glob", "grep", "memoryRead"],
  },
  {
    name: "planner",
    icon: "📋",
    label: "Planner Agent",
    description: "Planning and strategy — designs approaches for complex multi-step tasks",
    tools: ["fileRead", "glob", "grep", "memoryRead"],
  },
];

export function AgentPanel({ messages }: AgentPanelProps) {
  const { invocations, stats } = useAgentInvocations(messages);
  const [showInventory, setShowInventory] = useState(true);

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Agent Executions
          </span>
          <Badge
            variant="outline"
            className="text-xs bg-gray-100 text-gray-500 border-gray-300"
          >
            {stats.totalInvocations} agent{stats.totalInvocations !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Summary stats */}
        {stats.totalInvocations > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="text-xs bg-gray-100 text-gray-500 border-gray-300 font-mono"
            >
              {stats.totalToolCalls} tool calls
            </Badge>
            <Badge
              variant="outline"
              className="text-xs bg-gray-100 text-gray-500 border-gray-300 font-mono"
            >
              ~{stats.totalTokens.toLocaleString()} tokens
            </Badge>
          </div>
        )}
      </div>

      {/* Invocation list */}
      <div className="flex-1 overflow-y-auto">
        {/* Available Agents inventory */}
        <div className="px-2 pt-2">
          <button
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-1.5 w-full text-left"
            onClick={() => setShowInventory((v) => !v)}
          >
            <span>{showInventory ? "▼" : "▶"}</span>
            <span className="font-medium">Available Agents ({AVAILABLE_AGENTS.length})</span>
          </button>
          {showInventory && (
            <div className="space-y-1 mb-3">
              {AVAILABLE_AGENTS.map((agent) => (
                <div key={agent.name} className="px-2 py-1.5 rounded bg-gray-50">
                  <div className="flex items-center gap-2 text-xs">
                    <span>{agent.icon}</span>
                    <span className="font-medium text-gray-800">{agent.label}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ml-auto ${agentColors[agent.name] || "text-gray-500 border-gray-300 bg-gray-100"}`}
                    >
                      {agent.name}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 ml-6">{agent.description}</p>
                  <div className="flex gap-1 flex-wrap mt-1 ml-6">
                    {agent.tools.map((t) => (
                      <span key={t} className="text-xs text-gray-600 font-mono">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {invocations.length === 0 ? (
          <div className="px-4 pb-4 text-center text-gray-500 text-sm">
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
        <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 shrink-0">
          <div className="text-xs text-gray-500">
            <span className="text-gray-500 font-medium">Total across all agents: </span>
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
