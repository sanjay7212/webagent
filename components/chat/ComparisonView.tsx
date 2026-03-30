"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ComparisonChatColumn,
  type ComparisonChatColumnHandle,
} from "./ComparisonChatColumn";
import { ChatInput } from "./ChatInput";
import type { Conversation } from "@/lib/types";

interface ComparisonViewProps {
  models: string[];
  createConversation: (
    title?: string,
    model?: string
  ) => Promise<Conversation>;
  /** Optional labels for each column (e.g. ["Single Agent", "Multi-Agent"]) */
  columnLabels?: string[];
  /** Pre-fill the shared input (e.g. from lab suggested prompts) */
  prefillInput?: string | null;
  onPrefillConsumed?: () => void;
}

type SendTarget = "both" | "left" | "right";

// Helper to get a display name from model ID
function getModelDisplayName(modelId: string): string {
  const parts = modelId.split(":");
  return parts[parts.length - 1];
}

export function ComparisonView({
  models,
  createConversation,
  columnLabels,
  prefillInput,
  onPrefillConsumed,
}: ComparisonViewProps) {
  // Keyed by slot index to support duplicate model IDs
  const [conversationIds, setConversationIds] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const [sendTarget, setSendTarget] = useState<SendTarget>("both");
  // Reactive loading state per slot — updated via onLoadingChange callbacks
  const [loadingSlots, setLoadingSlots] = useState<boolean[]>([]);
  const anyLoading = loadingSlots.some(Boolean);

  // Apply prefill from lab suggested prompts
  useEffect(() => {
    if (prefillInput) {
      setInput(prefillInput);
      onPrefillConsumed?.();
    }
  }, [prefillInput, onPrefillConsumed]);

  // Refs keyed by slot index
  const columnRefs = useRef<(ComparisonChatColumnHandle | null)[]>([]);

  // Create one conversation per slot on mount / when models change
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const ids: string[] = [];
      for (const modelId of models) {
        const displayName = getModelDisplayName(modelId);
        const conv = await createConversation(
          `Compare: ${displayName}`,
          modelId
        );
        if (cancelled) return;
        ids.push(conv.id);
      }
      setConversationIds(ids);
      setReady(true);
    }

    setReady(false);
    setConversationIds([]);
    setLoadingSlots(new Array(models.length).fill(false));
    columnRefs.current = new Array(models.length).fill(null);
    init();

    return () => {
      cancelled = true;
    };
  }, [models, createConversation]);

  // Determine which slot indices to send to based on sendTarget
  const getTargetIndices = useCallback((): number[] => {
    if (sendTarget === "left") return [0];
    if (sendTarget === "right") return [models.length - 1];
    return models.map((_, i) => i);
  }, [sendTarget, models]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || anyLoading) return;
      const text = input;
      setInput("");

      const indices = getTargetIndices();
      const promises = indices.map((idx) => {
        const ref = columnRefs.current[idx];
        return ref?.sendMessage(text);
      });

      await Promise.allSettled(promises);
    },
    [input, anyLoading, getTargetIndices]
  );

  const handleStop = useCallback(() => {
    for (const ref of columnRefs.current) {
      ref?.stop();
    }
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  if (!ready) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="animate-pulse text-lg mb-2">⚖️</div>
          <p className="text-sm">
            Setting up comparison for {models.length} models...
          </p>
        </div>
      </div>
    );
  }

  const targetBtnClass = (t: SendTarget) =>
    `text-xs px-2.5 py-1 rounded-full border transition-colors font-medium ${
      sendTarget === t
        ? "bg-[#5ba4b5] border-[#5ba4b5] text-white"
        : "bg-white border-gray-300 text-gray-600 hover:border-[#5ba4b5] hover:text-[#5ba4b5]"
    }`;

  return (
    <div className="flex flex-col h-full min-h-0 flex-1">
      {/* Side-by-side panels */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {models.map((modelId, idx) => {
          const convId = conversationIds[idx];
          if (!convId) return null;

          return (
            <div
              key={idx}
              className={`flex-1 flex flex-col min-w-0 min-h-0 ${
                idx < models.length - 1 ? "border-r border-gray-200" : ""
              }`}
            >
              <ComparisonChatColumn
                ref={(handle) => {
                  columnRefs.current[idx] = handle;
                }}
                conversationId={convId}
                model={modelId}
                modelName={getModelDisplayName(modelId)}
                label={columnLabels?.[idx]}
                onLoadingChange={(loading) => {
                  setLoadingSlots((prev) => {
                    const next = [...prev];
                    next[idx] = loading;
                    return next;
                  });
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Send-target selector */}
      <div className="flex items-center justify-center gap-2 px-4 py-2 border-t border-gray-100 bg-gray-50 shrink-0">
        <span className="text-xs text-gray-500 mr-1">Send to:</span>
        <button
          className={targetBtnClass("left")}
          onClick={() => setSendTarget("left")}
          title="Send prompt to left panel only"
        >
          ← Left only
        </button>
        <button
          className={targetBtnClass("both")}
          onClick={() => setSendTarget("both")}
          title="Send prompt to both panels simultaneously"
        >
          Both panels
        </button>
        <button
          className={targetBtnClass("right")}
          onClick={() => setSendTarget("right")}
          title="Send prompt to right panel only"
        >
          Right only →
        </button>
      </div>

      {/* Shared input */}
      <ChatInput
        input={input}
        onChange={handleChange}
        onSubmit={handleSubmit}
        isLoading={anyLoading}
        onStop={handleStop}
      />
    </div>
  );
}
