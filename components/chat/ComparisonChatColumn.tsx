"use client";

import { useState, useImperativeHandle, forwardRef, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageList } from "./MessageList";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ComparisonChatColumnHandle {
  sendMessage: (text: string) => Promise<void>;
  stop: () => void;
  isLoading: boolean;
  tokenUsage: TokenUsage | null;
}

interface ComparisonChatColumnProps {
  conversationId: string;
  model: string;
  modelName: string;
  /** Optional context label shown above the model badge (e.g. "Single Agent" / "Multi-Agent") */
  label?: string;
  /** Called whenever this column's loading state changes — lets the parent re-render reactively */
  onLoadingChange?: (isLoading: boolean) => void;
}

export const ComparisonChatColumn = forwardRef<
  ComparisonChatColumnHandle,
  ComparisonChatColumnProps
>(function ComparisonChatColumn({ conversationId, model, modelName, label, onLoadingChange }, ref) {
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);

  const { messages, sendMessage, status, stop } = useChat({
    id: `compare-${conversationId}`,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { conversationId, model },
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Keep a stable ref to the latest onLoadingChange so the effect below only
  // re-fires when isLoading actually changes (not when the parent re-renders
  // with a new inline callback, which would cause an infinite loop).
  const onLoadingChangeRef = useRef(onLoadingChange);
  onLoadingChangeRef.current = onLoadingChange;

  useEffect(() => {
    onLoadingChangeRef.current?.(isLoading);
  }, [isLoading]); // intentionally omits onLoadingChange — use the ref instead

  // Estimate tokens from text when streaming finishes
  useEffect(() => {
    if (isLoading || messages.length === 0) return;
    // Rough estimation: ~4 chars per token (standard approximation)
    let inputChars = 0;
    let outputChars = 0;
    for (const msg of messages) {
      const text = msg.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join("");
      if (msg.role === "user") inputChars += text.length;
      else outputChars += text.length;
    }
    if (outputChars > 0) {
      setTokenUsage({
        promptTokens: Math.ceil(inputChars / 4),
        completionTokens: Math.ceil(outputChars / 4),
        totalTokens: Math.ceil((inputChars + outputChars) / 4),
      });
    }
  }, [messages, isLoading]);

  useImperativeHandle(
    ref,
    () => ({
      sendMessage: async (text: string) => {
        setTokenUsage(null);
        await sendMessage({ text });
      },
      stop,
      isLoading,
      tokenUsage,
    }),
    [sendMessage, stop, isLoading, tokenUsage]
  );

  // Provider color mapping
  const providerColor = model.startsWith("anthropic:")
    ? "text-orange-400 border-orange-400/30"
    : model.startsWith("openai:")
      ? "text-green-600 border-green-400/30"
      : "text-blue-400 border-blue-400/30";

  // Prevent ancestor scroll on mount
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let parent = el.parentElement;
    while (parent) {
      if (parent.scrollTop !== 0) parent.scrollTop = 0;
      parent = parent.parentElement;
    }
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col h-full min-h-0">
      {/* Model header */}
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 shrink-0">
        {label && (
          <div className="text-xs font-semibold text-gray-700 mb-1 truncate">{label}</div>
        )}
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-medium ${providerColor} border rounded px-1.5 py-0.5`}
          >
            {modelName}
          </span>
          {isLoading && (
            <span className="text-xs text-gray-500 animate-pulse">
              generating...
            </span>
          )}
          {!isLoading && tokenUsage && (
            <span className="text-xs text-gray-500 font-mono">
              ~{tokenUsage.totalTokens.toLocaleString()} tok
            </span>
          )}
        </div>
      </div>

      {/* Messages — scrollable */}
      <div className="flex-1 min-h-0 flex flex-col">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* Token breakdown footer */}
      {!isLoading && tokenUsage && (
        <div className="px-3 py-1.5 border-t border-gray-200 bg-gray-50 shrink-0">
          <div className="flex gap-3 text-xs text-gray-500 font-mono">
            <span>in: ~{tokenUsage.promptTokens.toLocaleString()}</span>
            <span>out: ~{tokenUsage.completionTokens.toLocaleString()}</span>
            <span className="text-gray-500">
              total: ~{tokenUsage.totalTokens.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
