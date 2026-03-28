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
      <div className="h-9 w-48 bg-gray-100 rounded-md animate-pulse" />
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
      <SelectTrigger className="w-56 bg-gray-100 border-gray-200 text-gray-800 text-sm">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent className="bg-gray-100 border-gray-200">
        {providerEntries.map(([provider, models]) => (
          <SelectGroup key={provider}>
            <SelectLabel className="text-gray-500 text-xs uppercase tracking-wider">
              {provider}
            </SelectLabel>
            {models.map((model) => (
              <SelectItem
                key={model.id}
                value={model.id}
                className="text-gray-800 focus:bg-gray-200 focus:text-gray-900"
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
