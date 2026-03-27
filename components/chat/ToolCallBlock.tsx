"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requiresApproval } from "@/lib/tools/permissions";

interface ToolCallBlockProps {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
  toolCallId?: string;
  onApprove?: (toolCallId: string) => void;
  onDeny?: (toolCallId: string) => void;
}

export function ToolCallBlock({
  toolName,
  args,
  state,
  result,
  toolCallId,
  onApprove,
  onDeny,
}: ToolCallBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const needsApproval =
    requiresApproval(toolName) && state === "call" && toolCallId;

  const statusColor =
    state === "result"
      ? "bg-green-500/10 text-green-500 border-green-500/20"
      : state === "call"
        ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
        : "bg-indigo-400/10 text-indigo-400 border-indigo-400/20";

  const statusText =
    state === "result" ? "Done" : state === "call" ? "Pending" : "Running";

  const toolIcon: Record<string, string> = {
    fileRead: "📄",
    fileWrite: "✏️",
    fileEdit: "🔧",
    bash: "💻",
    glob: "🔍",
    grep: "🔎",
    spawnAgent: "🤖",
    memoryRead: "🧠",
    memoryWrite: "🧠",
  };

  return (
    <div className="border border-zinc-700 rounded-lg my-2 bg-zinc-800/50 overflow-hidden">
      <button
        className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-zinc-700/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-sm">{toolIcon[toolName] || "🔧"}</span>
        <span className="font-mono text-sm text-zinc-200">{toolName}</span>
        {"file_path" in args && args.file_path ? (
          <span className="text-xs text-zinc-400 truncate">
            {String(args.file_path)}
          </span>
        ) : null}
        {"command" in args && args.command ? (
          <span className="text-xs text-zinc-400 font-mono truncate max-w-[200px]">
            {String(args.command)}
          </span>
        ) : null}
        {"agent" in args && args.agent ? (
          <span className="text-xs text-zinc-400 truncate max-w-[300px]">
            {String(args.agent)}: {String(args.task || "").slice(0, 60)}
          </span>
        ) : null}
        <Badge variant="outline" className={`ml-auto text-xs ${statusColor}`}>
          {statusText}
        </Badge>
        <span className="text-zinc-500 text-xs">{expanded ? "▼" : "▶"}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-zinc-700">
          <div className="mt-2">
            <div className="text-xs text-zinc-400 mb-1">Parameters</div>
            <pre className="text-xs bg-zinc-900 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>

          {needsApproval && onApprove && onDeny && (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => onApprove(toolCallId)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDeny(toolCallId)}
              >
                Deny
              </Button>
            </div>
          )}

          {result !== undefined && (
            <div className="mt-2">
              <div className="text-xs text-zinc-400 mb-1">Result</div>
              <pre className="text-xs bg-zinc-900 p-2 rounded overflow-auto max-h-60 whitespace-pre-wrap">
                {typeof result === "string"
                  ? result
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
