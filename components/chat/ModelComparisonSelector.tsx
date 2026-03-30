"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProviders } from "@/lib/hooks/useProviders";

interface ModelComparisonSelectorProps {
  selected: string[];
  onChange: (models: string[]) => void;
}

export function ModelComparisonSelector({
  selected,
  onChange,
}: ModelComparisonSelectorProps) {
  const { groupedModels, loading } = useProviders();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Count how many times a model appears in selection
  const countOf = (modelId: string) =>
    selected.filter((m) => m === modelId).length;

  // Add one slot for a model (called from both the row click and the "＋ Add again" button)
  const addModel = (modelId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const count = countOf(modelId);
    if (count < 2 && selected.length < 3) {
      onChange([...selected, modelId]);
    }
  };

  // Remove badge by index in the selected array
  const removeBadge = (idx: number) => {
    onChange([...selected.slice(0, idx), ...selected.slice(idx + 1)]);
  };

  // Quick-setup: select the same model twice for prompt-strategy comparison
  const quickSameModel = (modelId: string) => {
    onChange([modelId, modelId]);
    setOpen(false);
  };

  if (loading) return null;

  // Collect all unique models for quick-setup section
  const allModels = Object.values(groupedModels).flat();
  // Default model for quick same-model setup
  const defaultModel = allModels.find(m => m.id.includes("claude-opus-4-6")) || allModels[0];

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="text-gray-700 hover:text-gray-900 border border-gray-200 bg-gray-100"
        onClick={() => setOpen(!open)}
      >
        {selected.length === 0
          ? "Select models..."
          : `${selected.length} panel${selected.length > 1 ? "s" : ""} selected`}
        <span className="ml-1 text-gray-500">▼</span>
      </Button>

      {open && (
        <div className="absolute top-full mt-1 right-0 w-80 bg-gray-100 border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Quick setup section */}
          <div className="p-2 border-b border-gray-200 space-y-1.5">
            <p className="text-xs font-semibold text-gray-600">Quick setup</p>
            <div className="flex gap-1.5 flex-wrap">
              {defaultModel && (
                <button
                  onClick={() => quickSameModel(defaultModel.id)}
                  className="text-xs px-2 py-1 rounded border border-[#5ba4b5]/40 bg-[#5ba4b5]/10 text-[#3d7a8a] hover:bg-[#5ba4b5]/20 font-medium transition-colors"
                >
                  🔀 Same model ×2 (compare prompts)
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">Or pick models manually below. Click <span className="font-medium text-gray-600">＋ Add again</span> to use the same model twice.</p>
          </div>

          {/* Model list */}
          <div className="max-h-60 overflow-y-auto p-1">
            {Object.entries(groupedModels).map(([provider, models]) => (
              <div key={provider}>
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {provider}
                </div>
                {models.map((model) => {
                  const count = countOf(model.id);
                  const canAddMore = count < 2 && selected.length < 3;
                  const isFirstAddDisabled = count > 0 || selected.length >= 3;

                  return (
                    <button
                      key={model.id}
                      type="button"
                      disabled={!canAddMore}
                      onClick={() => addModel(model.id)}
                      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm transition-colors text-left ${
                        count > 0 ? "bg-[#5ba4b5]/10" : ""
                      } ${
                        !canAddMore
                          ? "opacity-50 cursor-default"
                          : "hover:bg-gray-200 cursor-pointer"
                      }`}
                    >
                      {/* Checkbox / count indicator */}
                      <span
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                          count > 0
                            ? "bg-[#5ba4b5] border-[#5ba4b5] text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {count > 1 ? count : count === 1 ? "✓" : ""}
                      </span>

                      {/* Model name */}
                      <span className="flex-1 text-gray-800">
                        {model.name}
                        {count > 1 && (
                          <span className="ml-1 text-xs text-[#5ba4b5] font-medium">×{count}</span>
                        )}
                      </span>

                      {/* "＋ Add again" hint — clicking the row adds the second slot */}
                      {count === 1 && canAddMore && (
                        <span className="text-xs px-1.5 py-0.5 rounded border border-[#5ba4b5]/40 text-[#3d7a8a] font-medium flex-shrink-0">
                          ＋ Add again
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Selected badges */}
          {selected.length > 0 && (
            <div className="p-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Panels (click ✕ to remove):</p>
              <div className="flex flex-wrap gap-1">
                {selected.map((id, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-xs bg-[#5ba4b5]/10 text-[#5ba4b5] border-[#5ba4b5]/20 cursor-pointer"
                    onClick={() => removeBadge(idx)}
                  >
                    {idx + 1}. {id.split(":").pop()} ✕
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
