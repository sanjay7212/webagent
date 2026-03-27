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
        className="text-zinc-300 hover:text-zinc-100 border border-zinc-700 bg-zinc-800"
        onClick={() => setOpen(!open)}
      >
        {selected.length === 0
          ? "Select models..."
          : `${selected.length} model${selected.length > 1 ? "s" : ""} selected`}
        <span className="ml-1 text-zinc-500">▼</span>
      </Button>

      {open && (
        <div className="absolute top-full mt-1 right-0 w-72 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-zinc-700 text-xs text-zinc-500">
            Select up to 3 models to compare
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {Object.entries(groupedModels).map(([provider, models]) => (
              <div key={provider}>
                <div className="px-2 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
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
                      } ${isSelected ? "bg-indigo-400/10" : ""}`}
                      onClick={() => !isDisabled && toggleModel(model.id)}
                      disabled={isDisabled}
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${
                          isSelected
                            ? "bg-indigo-400 border-indigo-400 text-white"
                            : "border-zinc-600"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                      <span className="text-zinc-200">{model.name}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="p-2 border-t border-zinc-700 flex flex-wrap gap-1">
              {selected.map((id) => (
                <Badge
                  key={id}
                  variant="outline"
                  className="text-xs bg-indigo-400/10 text-indigo-400 border-indigo-400/20 cursor-pointer"
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
