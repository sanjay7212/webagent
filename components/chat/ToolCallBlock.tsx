"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  requiresApprovalWithPolicy,
  requiresApproval,
  getRiskLevel,
  getRiskIcon,
  getRiskColor,
  getRiskBgColor,
  TOOL_META,
  type ClientToolPolicy,
} from "@/lib/tools/permissions";

interface ToolCallBlockProps {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
  toolCallId?: string;
  policies?: ClientToolPolicy[];
  onApprove?: (toolCallId: string) => void;
  onDeny?: (toolCallId: string) => void;
  onApproveRemember?: (toolCallId: string, toolName: string, args: Record<string, unknown>) => void;
}

export function ToolCallBlock({
  toolName,
  args,
  state,
  result,
  toolCallId,
  policies,
  onApprove,
  onDeny,
  onApproveRemember,
}: ToolCallBlockProps) {
  const [expanded, setExpanded] = useState(false);

  // Normalize state for both old ("call"/"result") and new ("input-available"/"output-available") SDK states
  const isDone = state === "output-available" || state === "result";
  const isPending = state === "approval-requested" || state === "call" || state === "input-available";
  const isError = state === "output-error";

  const needsApproval = policies
    ? requiresApprovalWithPolicy(toolName, args, policies) && isPending && toolCallId
    : requiresApproval(toolName) && isPending && toolCallId;

  const risk = getRiskLevel(toolName);
  const riskColor = getRiskColor(risk);
  const riskBg = getRiskBgColor(risk);
  const meta = TOOL_META[toolName];

  const statusColor = isDone
    ? "bg-green-500/10 text-green-500 border-green-500/20"
    : isError
      ? "bg-red-500/10 text-red-500 border-red-500/20"
      : isPending
        ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
        : "bg-[#5ba4b5]/10 text-[#5ba4b5] border-[#5ba4b5]/20";

  const statusText = isDone ? "Done" : isError ? "Error" : isPending ? "Pending" : "Running";

  // Determine policy attribution
  const policyInfo = policies?.find((p) => p.toolName === toolName);
  const policyLabel = policyInfo
    ? policyInfo.policy === "auto_approve"
      ? "Auto-approved"
      : policyInfo.policy === "always_ask"
        ? "Requires approval"
        : "Conditional"
    : isDone
      ? "Completed"
      : "";

  return (
    <div className={`border rounded-lg my-2 bg-gray-50 overflow-hidden ${
      needsApproval ? "border-yellow-500/40 shadow-sm shadow-yellow-500/10" : "border-gray-200"
    }`}>
      <button
        className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Risk indicator */}
        <span className="text-xs shrink-0" title={`Risk: ${risk}`}>
          {getRiskIcon(risk)}
        </span>
        <span className="text-sm shrink-0">{meta?.icon || "🔧"}</span>
        <span className="font-mono text-sm text-gray-800">{toolName}</span>
        {"file_path" in args && args.file_path ? (
          <span className="text-xs text-gray-500 truncate">
            {String(args.file_path)}
          </span>
        ) : null}
        {"command" in args && args.command ? (
          <span className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
            {String(args.command)}
          </span>
        ) : null}
        {"agent" in args && args.agent ? (
          <span className="text-xs text-gray-500 truncate max-w-[300px]">
            {String(args.agent)}: {String(args.task || "").slice(0, 60)}
          </span>
        ) : null}
        <Badge variant="outline" className={`ml-auto text-xs ${statusColor}`}>
          {statusText}
        </Badge>
        <span className="text-gray-500 text-xs">{expanded ? "▼" : "▶"}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-200">
          {/* Risk + Policy info bar */}
          <div className="flex items-center gap-2 mt-2 mb-2">
            <Badge variant="outline" className={`text-xs ${riskBg} ${riskColor}`}>
              {risk} risk
            </Badge>
            {policyLabel && (
              <span className="text-xs text-gray-500">
                Policy: {policyLabel}
              </span>
            )}
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Parameters</div>
            <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>

          {needsApproval && onApprove && onDeny && (
            <div className="flex gap-2 mt-3 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
              <Button
                size="sm"
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-xs"
                onClick={() => onApprove(toolCallId!)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="text-xs"
                onClick={() => onDeny(toolCallId!)}
              >
                Deny
              </Button>
              {onApproveRemember && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-600/30 text-green-400 hover:bg-green-600/10 text-xs ml-auto"
                  onClick={() => {
                    onApprove(toolCallId!);
                    onApproveRemember(toolCallId!, toolName, args);
                  }}
                >
                  Approve & Remember
                </Button>
              )}
            </div>
          )}

          {result !== undefined && (
            <div className="mt-2">
              <div className="text-xs text-gray-500 mb-1">Result</div>
              <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-60 whitespace-pre-wrap">
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
