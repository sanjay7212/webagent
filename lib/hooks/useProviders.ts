"use client";

import { useState, useEffect } from "react";
import type { ModelInfo } from "@/lib/providers/models";

export function useProviders() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/providers")
      .then((res) => res.json())
      .then((data) => setModels(data.models))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const groupedModels = models.reduce(
    (acc, model) => {
      if (!acc[model.providerName]) {
        acc[model.providerName] = [];
      }
      acc[model.providerName].push(model);
      return acc;
    },
    {} as Record<string, ModelInfo[]>
  );

  return { models, groupedModels, loading };
}
