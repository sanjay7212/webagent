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
}

// Helper to get a display name from model ID
function getModelDisplayName(modelId: string): string {
  const parts = modelId.split(":");
  return parts[parts.length - 1];
}

export function ComparisonView({
  models,
  createConversation,
}: ComparisonViewProps) {
  const [conversationIds, setConversationIds] = useState<
    Record<string, string>
  >({});
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);

  const columnRefs = useRef<Record<string, ComparisonChatColumnHandle | null>>(
    {}
  );

  // Create a conversation for each model on mount / when models change
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const ids: Record<string, string> = {};
      for (const modelId of models) {
        const displayName = getModelDisplayName(modelId);
        const conv = await createConversation(
          `Compare: ${displayName}`,
          modelId
        );
        if (cancelled) return;
        ids[modelId] = conv.id;
      }
      setConversationIds(ids);
      setReady(true);
    }

    setReady(false);
    setConversationIds({});
    init();

    return () => {
      cancelled = true;
    };
  }, [models, createConversation]);

  const anyLoading = Object.values(columnRefs.current).some(
    (ref) => ref?.isLoading
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || anyLoading) return;
      const text = input;
      setInput("");

      // Send to all models in parallel
      const promises = models.map((modelId) => {
        const ref = columnRefs.current[modelId];
        return ref?.sendMessage(text);
      });

      await Promise.allSettled(promises);
    },
    [input, anyLoading, models]
  );

  const handleStop = useCallback(() => {
    for (const ref of Object.values(columnRefs.current)) {
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
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        <div className="text-center">
          <div className="animate-pulse text-lg mb-2">⚖️</div>
          <p className="text-sm">
            Setting up comparison for {models.length} models...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Side-by-side panels */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {models.map((modelId, idx) => {
          const convId = conversationIds[modelId];
          if (!convId) return null;

          return (
            <div
              key={modelId}
              className={`flex-1 flex flex-col min-w-0 min-h-0 ${
                idx < models.length - 1 ? "border-r border-zinc-700" : ""
              }`}
            >
              <ComparisonChatColumn
                ref={(handle) => {
                  columnRefs.current[modelId] = handle;
                }}
                conversationId={convId}
                model={modelId}
                modelName={getModelDisplayName(modelId)}
              />
            </div>
          );
        })}
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
