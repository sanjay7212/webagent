"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatPanel } from "./ChatPanel";
import { ToolCallPanel } from "./ToolCallPanel";
import { AgentPanel } from "./AgentPanel";
import { FileExplorer } from "@/components/sidebar/FileExplorer";

interface ActiveChatViewProps {
  conversationId: string;
  model: string;
  showToolCalls: boolean;
  showAgentPanel: boolean;
  showFiles: boolean;
  workspaceId: string;
  onFileSelect: (path: string, content: string) => void;
}

export function ActiveChatView({
  conversationId,
  model,
  showToolCalls,
  showAgentPanel,
  showFiles,
  workspaceId,
  onFileSelect,
}: ActiveChatViewProps) {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, stop } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { conversationId, model },
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      const text = input;
      setInput("");
      await sendMessage({ text });
    },
    [input, isLoading, sendMessage]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  // Prevent ancestor scroll — browser focus/scroll events can push
  // overflow:hidden parents off-screen
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Walk up and reset any scrolled ancestors
    let parent = el.parentElement;
    while (parent) {
      if (parent.scrollTop !== 0) {
        parent.scrollTop = 0;
      }
      parent = parent.parentElement;
    }
  });

  return (
    <div ref={containerRef} className="flex-1 flex overflow-hidden min-h-0">
      {/* Chat panel */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          input={input}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onStop={stop}
        />
      </div>

      {/* Tool Call Panel (right sidebar) */}
      {showToolCalls && (
        <div className="w-80 shrink-0">
          <ToolCallPanel messages={messages} />
        </div>
      )}

      {/* Agent Panel (right sidebar) */}
      {showAgentPanel && (
        <div className="w-80 shrink-0">
          <AgentPanel messages={messages} />
        </div>
      )}

      {/* File Explorer (right sidebar) */}
      {showFiles && (
        <div className="w-64 shrink-0">
          <FileExplorer workspaceId={workspaceId} onFileSelect={onFileSelect} />
        </div>
      )}
    </div>
  );
}
