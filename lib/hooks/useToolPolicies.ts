"use client";

import { useState, useEffect, useCallback } from "react";
import type { ClientToolPolicy, PolicyLevel } from "@/lib/tools/permissions";

interface PresetInfo {
  id: string;
  label: string;
  description: string;
}

interface ToolPoliciesState {
  policies: ClientToolPolicy[];
  activePreset: string | null;
  presets: PresetInfo[];
  loading: boolean;
  error: string | null;
}

export function useToolPolicies() {
  const [state, setState] = useState<ToolPoliciesState>({
    policies: [],
    activePreset: null,
    presets: [],
    loading: true,
    error: null,
  });

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await fetch("/api/tool-policies");
      if (!res.ok) throw new Error("Failed to fetch policies");
      const data = await res.json();
      setState({
        policies: data.policies,
        activePreset: data.activePreset,
        presets: data.presets,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const updatePolicy = useCallback(
    async (
      toolName: string,
      policy: PolicyLevel,
      conditions?: { field: string; operator: string; value: string }[]
    ) => {
      try {
        const res = await fetch("/api/tool-policies", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolName, policy, conditions }),
        });
        if (!res.ok) throw new Error("Failed to update policy");
        const data = await res.json();
        setState((prev) => ({
          ...prev,
          policies: data.policies,
          activePreset: "custom",
        }));
      } catch (err) {
        console.error("Failed to update policy:", err);
      }
    },
    []
  );

  const applyPreset = useCallback(async (presetId: string) => {
    try {
      const res = await fetch("/api/tool-policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset: presetId }),
      });
      if (!res.ok) throw new Error("Failed to apply preset");
      const data = await res.json();
      setState((prev) => ({
        ...prev,
        policies: data.policies,
        activePreset: data.activePreset,
      }));
    } catch (err) {
      console.error("Failed to apply preset:", err);
    }
  }, []);

  const approveAndRemember = useCallback(
    async (toolName: string, args: Record<string, unknown>) => {
      try {
        const res = await fetch("/api/tool-policies", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approveRemember: true, toolName, args }),
        });
        if (!res.ok) throw new Error("Failed to apply approve & remember");
        const data = await res.json();
        setState((prev) => ({
          ...prev,
          policies: data.policies,
        }));
      } catch (err) {
        console.error("Failed to approve & remember:", err);
      }
    },
    []
  );

  return {
    ...state,
    updatePolicy,
    applyPreset,
    approveAndRemember,
    refetch: fetchPolicies,
  };
}
