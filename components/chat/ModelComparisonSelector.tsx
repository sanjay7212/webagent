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

  const toggleModel = (modelId: string) => {
    if (selected.includes(modelId)) {
      onChange(selected.filter((m) => m !== modelId));
    } else if (selected.length < 3) {
      onChange([...selected, modelId]);
    }
  };

  if (loading) return null;

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
          : `${selected.length} model${selected.length > 1 ? "s" : ""} selected`}
        <span className="ml-1 text-gray-500">▼</span>
      </Button>

      {open && (
        <div className="absolute top-full mt-1 right-0 w-72 bg-gray-100 border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-200 text-xs text-gray-500">
            Select up to 3 models to compare
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {Object.entries(groupedModels).map(([provider, models]) => (
              <div key={provider}>
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {provider}
                </div>
                {models.map((model) => {
                  const isSelected = selected.includes(model.id);
                  const isDisabled = !isSelected && selected.length >= 3;

                  return (
                    <button
                      key={model.id}
                      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-left transition-colors ${
                        isDisabled
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-zinc-700/50 cursor-pointer"
                      } ${isSelected ? "bg-[#5ba4b5]/10" : ""}`}
                      onClick={() => !isDisabled && toggleModel(model.id)}
                      disabled={isDisabled}
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                          isSelected
                            ? "bg-[#5ba4b5] border-[#5ba4b5] text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                      <span className="text-gray-800">{model.name}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="p-2 border-t border-gray-200 flex flex-wrap gap-1">
              {selected.map((id) => (
                <Badge
                  key={id}
                  variant="outline"
                  className="text-xs bg-[#5ba4b5]/10 text-[#5ba4b5] border-[#5ba4b5]/20 cursor-pointer"
                  onClick={() => toggleModel(id)}
                >
                  {id.split(":").pop()} ✕
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
