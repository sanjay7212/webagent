"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToolPolicies } from "@/lib/hooks/useToolPolicies";
import {
  TOOL_META,
  ALL_TOOL_NAMES,
  getRiskLevel,
  getRiskIcon,
  type PolicyLevel,
} from "@/lib/tools/permissions";

interface ConditionEditorProps {
  toolName: string;
  conditions: { field: string; operator: string; value: string }[];
  onSave: (conditions: { field: string; operator: string; value: string }[]) => void;
}

function ConditionEditor({ toolName, conditions, onSave }: ConditionEditorProps) {
  const [localConditions, setLocalConditions] = useState(conditions);

  const fieldOptions: Record<string, string[]> = {
    bash: ["command"],
    fileRead: ["file_path"],
    fileWrite: ["file_path"],
    fileEdit: ["file_path"],
    glob: ["pattern"],
    grep: ["pattern"],
    spawnAgent: ["agent", "task"],
    memoryRead: [],
    memoryWrite: ["content"],
  };

  const fields = fieldOptions[toolName] || ["file_path"];

  const addCondition = () => {
    setLocalConditions([
      ...localConditions,
      { field: fields[0] || "file_path", operator: "contains", value: "" },
    ]);
  };

  const removeCondition = (idx: number) => {
    const updated = localConditions.filter((_, i) => i !== idx);
    setLocalConditions(updated);
    onSave(updated);
  };

  const updateCondition = (
    idx: number,
    key: string,
    val: string
  ) => {
    const updated = localConditions.map((c, i) =>
      i === idx ? { ...c, [key]: val } : c
    );
    setLocalConditions(updated);
  };

  return (
    <div className="mt-2 space-y-2">
      {localConditions.map((cond, idx) => (
        <div key={idx} className="flex items-center gap-1.5 text-xs">
          <select
            className="bg-gray-100 border border-gray-300 rounded px-1.5 py-1 text-gray-700"
            value={cond.field}
            onChange={(e) => updateCondition(idx, "field", e.target.value)}
          >
            {fields.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <select
            className="bg-gray-100 border border-gray-300 rounded px-1.5 py-1 text-gray-700"
            value={cond.operator}
            onChange={(e) => updateCondition(idx, "operator", e.target.value)}
          >
            <option value="contains">contains</option>
            <option value="starts_with">starts with</option>
            <option value="matches_regex">regex</option>
          </select>
          <input
            className="flex-1 bg-gray-100 border border-gray-300 rounded px-1.5 py-1 text-gray-700 min-w-0"
            value={cond.value}
            placeholder="value..."
            onChange={(e) => updateCondition(idx, "value", e.target.value)}
            onBlur={() => onSave(localConditions)}
          />
          <button
            className="text-gray-500 hover:text-red-600 shrink-0"
            onClick={() => removeCondition(idx)}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        className="text-xs text-[#5ba4b5] hover:text-indigo-300"
        onClick={addCondition}
      >
        + Add condition
      </button>
    </div>
  );
}

export function ToolPolicyPanel() {
  const {
    policies,
    activePreset,
    presets,
    loading,
    updatePolicy,
    applyPreset,
  } = useToolPolicies();

  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        Loading policies...
      </div>
    );
  }

  const policyMap = new Map(policies.map((p) => [p.toolName, p]));

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div>
        <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
          Presets
        </div>
        <div className="flex gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.id}
              size="sm"
              variant={activePreset === preset.id ? "default" : "outline"}
              className={
                activePreset === preset.id
                  ? "bg-[#5ba4b5] hover:bg-[#4a8fa0] text-white text-xs"
                  : "border-gray-300 text-gray-500 hover:text-gray-800 text-xs"
              }
              onClick={() => applyPreset(preset.id)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        {activePreset && activePreset !== "custom" && (
          <p className="text-xs text-gray-500 mt-1.5">
            {presets.find((p) => p.id === activePreset)?.description}
          </p>
        )}
        {activePreset === "custom" && (
          <p className="text-xs text-gray-500 mt-1.5">Custom configuration</p>
        )}
      </div>

      {/* Tool policies table */}
      <div>
        <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
          Per-Tool Policies
        </div>
        <div className="space-y-1">
          {ALL_TOOL_NAMES.map((toolName) => {
            const meta = TOOL_META[toolName];
            const risk = getRiskLevel(toolName);
            const policy = policyMap.get(toolName);
            const currentPolicy = policy?.policy || "auto_approve";
            const conditions = policy?.conditions || [];
            const isExpanded = expandedTool === toolName;

            return (
              <div
                key={toolName}
                className="bg-gray-100 rounded-lg border border-gray-200 overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-2">
                  {/* Risk + icon */}
                  <span className="text-sm shrink-0" title={`Risk: ${risk}`}>
                    {getRiskIcon(risk)}
                  </span>
                  <span className="text-sm shrink-0">{meta.icon}</span>

                  {/* Name */}
                  <button
                    className="text-xs text-gray-800 font-mono hover:text-white min-w-[80px] text-left"
                    onClick={() => setExpandedTool(isExpanded ? null : toolName)}
                  >
                    {toolName}
                  </button>

                  {/* Policy selector */}
                  <select
                    className="ml-auto bg-gray-200 border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 shrink-0"
                    value={currentPolicy}
                    onChange={(e) => {
                      const newPolicy = e.target.value as PolicyLevel;
                      updatePolicy(toolName, newPolicy, conditions);
                      if (newPolicy === "conditional") {
                        setExpandedTool(toolName);
                      }
                    }}
                  >
                    <option value="auto_approve">Auto-approve</option>
                    <option value="always_ask">Always ask</option>
                    <option value="conditional">Ask if...</option>
                  </select>

                  {/* Condition count badge */}
                  {currentPolicy === "conditional" && conditions.length > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 shrink-0"
                    >
                      {conditions.length} rule{conditions.length > 1 ? "s" : ""}
                    </Badge>
                  )}

                  {/* Expand arrow */}
                  <button
                    className="text-gray-500 text-xs shrink-0"
                    onClick={() => setExpandedTool(isExpanded ? null : toolName)}
                  >
                    {isExpanded ? "▼" : "▶"}
                  </button>
                </div>

                {/* Expanded: description + conditions */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mt-2">{meta.description}</p>
                    {currentPolicy === "conditional" && (
                      <ConditionEditor
                        toolName={toolName}
                        conditions={conditions}
                        onSave={(newConditions) =>
                          updatePolicy(toolName, "conditional", newConditions)
                        }
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
