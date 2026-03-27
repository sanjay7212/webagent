"use client";

import { useProviders } from "@/lib/hooks/useProviders";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const { groupedModels, loading } = useProviders();

  if (loading) {
    return (
      <div className="h-9 w-48 bg-zinc-800 rounded-md animate-pulse" />
    );
  }

  const providerEntries = Object.entries(groupedModels);

  if (providerEntries.length === 0) {
    return (
      <div className="text-xs text-red-400 px-2">
        No API keys configured
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={(val) => { if (val) onChange(val); }}>
      <SelectTrigger className="w-56 bg-zinc-800 border-zinc-700 text-zinc-200 text-sm">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent className="bg-zinc-800 border-zinc-700">
        {providerEntries.map(([provider, models]) => (
          <SelectGroup key={provider}>
            <SelectLabel className="text-zinc-400 text-xs uppercase tracking-wider">
              {provider}
            </SelectLabel>
            {models.map((model) => (
              <SelectItem
                key={model.id}
                value={model.id}
                className="text-zinc-200 focus:bg-zinc-700 focus:text-zinc-100"
              >
                {model.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
