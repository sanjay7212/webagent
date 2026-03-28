"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useToolCalls } from "@/lib/hooks/useToolCalls";
import { useToolPolicies } from "@/lib/hooks/useToolPolicies";
import {
  TOOL_META,
  getRiskLevel,
  getRiskIcon,
  getRiskColor,
  getRiskBgColor,
} from "@/lib/tools/permissions";
import type { UIMessage } from "ai";

interface ToolCallPanelProps {
  messages: UIMessage[];
}

export function ToolCallPanel({ messages }: ToolCallPanelProps) {
  const { toolCalls, stats } = useToolCalls(messages);
  const { policies, activePreset } = useToolPolicies();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showInventory, setShowInventory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getPolicyLabel = (toolName: string): string => {
    const policy = policies.find((p) => p.toolName === toolName);
    if (!policy) return "";
    const suffix = activePreset && activePreset !== "custom" ? ` (${activePreset})` : "";
    switch (policy.policy) {
      case "auto_approve": return `Auto-approved${suffix}`;
      case "always_ask": return `Manual approval${suffix}`;
      case "conditional": return `Conditional${suffix}`;
      default: return "";
    }
  };

  // Auto-scroll to latest tool call
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [toolCalls.length]);

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-700">
      {/* Header */}
      <div className="p-3 border-b border-zinc-700 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-300">
            Tool Calls
          </span>
          <Badge
            variant="outline"
            className="text-xs bg-zinc-800 text-zinc-400 border-zinc-600"
          >
            {stats.total} total
          </Badge>
        </div>

        {/* Status summary */}
        {stats.total > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {stats.byStatus.done > 0 && (
              <Badge
                variant="outline"
                className="text-xs bg-green-500/10 text-green-500 border-green-500/20"
              >
                ✓ {stats.byStatus.done}
              </Badge>
            )}
            {stats.byStatus.running > 0 && (
              <Badge
                variant="outline"
                className="text-xs bg-indigo-400/10 text-indigo-400 border-indigo-400/20"
              >
                ◉ {stats.byStatus.running}
              </Badge>
            )}
            {stats.byStatus.pending > 0 && (
              <Badge
                variant="outline"
                className="text-xs bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
              >
                ⏳ {stats.byStatus.pending}
              </Badge>
            )}
            {stats.byStatus.error > 0 && (
              <Badge
                variant="outline"
                className="text-xs bg-red-500/10 text-red-500 border-red-500/20"
              >
                ✗ {stats.byStatus.error}
              </Badge>
            )}
          </div>
        )}

        {/* Tool type breakdown */}
        {Object.keys(stats.byTool).length > 0 && (
          <div className="flex gap-1 flex-wrap mt-2">
            {Object.entries(stats.byTool).map(([name, count]) => (
              <Badge
                key={name}
                variant="outline"
                className="text-xs bg-zinc-800 text-zinc-400 border-zinc-600"
              >
                {TOOL_META[name]?.icon || "🔧"} {name}: {count}
              </Badge>
            ))}
          </div>
        )}

        {/* Active policy indicator */}
        {activePreset && (
          <div className="mt-2 text-xs text-zinc-500">
            Policy: <span className="text-zinc-400">{activePreset === "custom" ? "Custom" : activePreset}</span>
          </div>
        )}
      </div>

      {/* Tool call list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Available Tools inventory */}
        <div className="px-2 pt-2">
          <button
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mb-1.5 w-full text-left"
            onClick={() => setShowInventory((v) => !v)}
          >
            <span>{showInventory ? "▼" : "▶"}</span>
            <span className="font-medium">Available Tools ({Object.keys(TOOL_META).length})</span>
          </button>
          {showInventory && (
            <div className="space-y-0.5 mb-3">
              {Object.entries(TOOL_META).map(([name, meta]) => {
                const risk = getRiskLevel(name);
                const pol = policies.find((p) => p.toolName === name);
                const policyTag = pol?.policy === "auto_approve" ? "auto" : pol?.policy === "always_ask" ? "ask" : pol?.policy === "conditional" ? "cond" : "—";
                return (
                  <div key={name} className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-800/60 text-xs">
                    <span>{getRiskIcon(risk)}</span>
                    <span>{meta.icon}</span>
                    <span className="font-mono text-zinc-300">{name}</span>
                    <span className="text-zinc-600 truncate min-w-0">{meta.description}</span>
                    <span className="ml-auto text-zinc-600 shrink-0 font-mono">{policyTag}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {toolCalls.length === 0 ? (
          <div className="px-4 pb-4 text-center text-zinc-500 text-sm">
            No tool calls yet. Send a message that requires the agent to
            take action (e.g., read a file, run a command).
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {toolCalls.map((tc) => {
              const isExpanded = expandedId === tc.toolCallId;
              const risk = getRiskLevel(tc.toolName);
              const riskColor = getRiskColor(risk);
              const statusColor =
                tc.state === "done"
                  ? "text-green-500"
                  : tc.state === "error"
                    ? "text-red-500"
                    : tc.state === "pending"
                      ? "text-yellow-500"
                      : "text-indigo-400";

              const summary =
                "file_path" in tc.args
                  ? String(tc.args.file_path)
                  : "command" in tc.args
                    ? String(tc.args.command).slice(0, 50)
                    : "agent" in tc.args
                      ? `${tc.args.agent}: ${String(tc.args.task || "").slice(0, 40)}`
                      : "pattern" in tc.args
                        ? String(tc.args.pattern)
                        : "";

              const policyLabel = getPolicyLabel(tc.toolName);

              return (
                <div
                  key={tc.toolCallId}
                  className="rounded-lg border border-zinc-700/50 bg-zinc-800/40 overflow-hidden"
                >
                  <button
                    className="flex items-center gap-2 px-2.5 py-1.5 w-full text-left hover:bg-zinc-700/30 transition-colors"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : tc.toolCallId)
                    }
                  >
                    <span className="text-xs shrink-0">{getRiskIcon(risk)}</span>
                    <span className="text-xs shrink-0">
                      {TOOL_META[tc.toolName]?.icon || "🔧"}
                    </span>
                    <span className="font-mono text-xs text-zinc-200 shrink-0">
                      {tc.toolName}
                    </span>
                    {summary && (
                      <span className="text-xs text-zinc-500 truncate min-w-0">
                        {summary}
                      </span>
                    )}
                    <span className={`ml-auto text-xs shrink-0 ${statusColor}`}>
                      {tc.state === "done"
                        ? "✓"
                        : tc.state === "error"
                          ? "✗"
                          : tc.state === "pending"
                            ? "⏳"
                            : "◉"}
                    </span>
                    <span className="text-zinc-600 text-xs shrink-0">
                      {isExpanded ? "▼" : "▶"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-2.5 pb-2 border-t border-zinc-700/50">
                      {/* Audit: risk + policy */}
                      <div className="flex items-center gap-2 mt-1.5 mb-1.5">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getRiskBgColor(risk)} ${riskColor}`}
                        >
                          {risk} risk
                        </Badge>
                        {policyLabel && (
                          <span className="text-xs text-zinc-500">{policyLabel}</span>
                        )}
                      </div>

                      <div className="mt-1.5">
                        <div className="text-xs text-zinc-500 mb-0.5">Input</div>
                        <pre className="text-xs bg-zinc-900 p-1.5 rounded overflow-auto max-h-32 text-zinc-300">
                          {JSON.stringify(tc.args, null, 2)}
                        </pre>
                      </div>
                      {tc.result !== undefined && (
                        <div className="mt-1.5">
                          <div className="text-xs text-zinc-500 mb-0.5">Output</div>
                          <pre className="text-xs bg-zinc-900 p-1.5 rounded overflow-auto max-h-40 whitespace-pre-wrap text-zinc-300">
                            {typeof tc.result === "string"
                              ? tc.result
                              : JSON.stringify(tc.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
