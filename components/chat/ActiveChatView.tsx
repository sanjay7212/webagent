"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ChatPanel } from "./ChatPanel";
import { ToolCallPanel } from "./ToolCallPanel";
import { AgentPanel } from "./AgentPanel";
import { useToolPolicies } from "@/lib/hooks/useToolPolicies";

interface ActiveChatViewProps {
  conversationId: string;
  model: string;
  showToolCalls: boolean;
  showAgentPanel: boolean;
  workspaceId: string;
}

export function ActiveChatView({
  conversationId,
  model,
  showToolCalls,
  showAgentPanel,
  workspaceId,
}: ActiveChatViewProps) {
  const [input, setInput] = useState("");
  const { policies, approveAndRemember } = useToolPolicies();

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

  const handleApprove = useCallback(async (toolCallId: string) => {
    await fetch("/api/chat/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolCallId, approved: true }),
    });
  }, []);

  const handleDeny = useCallback(async (toolCallId: string) => {
    await fetch("/api/chat/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolCallId, approved: false }),
    });
  }, []);

  const handleApproveRemember = useCallback(
    async (toolCallId: string, toolName: string, args: Record<string, unknown>) => {
      // Approve the current call
      await fetch("/api/chat/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolCallId, approved: true }),
      });
      // Remember: auto-approve this tool in the future
      await approveAndRemember(toolName, args);
    },
    [approveAndRemember]
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
          policies={policies}
          onApprove={handleApprove}
          onDeny={handleDeny}
          onApproveRemember={handleApproveRemember}
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


    </div>
  );
}
