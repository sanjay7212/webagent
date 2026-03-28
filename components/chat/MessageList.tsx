"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import type { UIMessage } from "ai";

import type { ClientToolPolicy } from "@/lib/tools/permissions";

interface MessageListProps {
  messages: UIMessage[];
  isLoading?: boolean;
  policies?: ClientToolPolicy[];
  onApprove?: (toolCallId: string) => void;
  onDeny?: (toolCallId: string) => void;
  onApproveRemember?: (toolCallId: string, toolName: string, args: Record<string, unknown>) => void;
}

export function MessageList({ messages, isLoading, policies, onApprove, onDeny, onApproveRemember }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll only within our own container — never affects ancestors
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">🎓</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Vocareum Agent
          </h2>
          <p className="text-sm max-w-md">
            Your AI assistant. Ask me to write code, create documents, analyze
            data, run commands, or tackle any task in your sandboxed workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {messages.map((message) => (
          <MessageBubble
              key={message.id}
              message={message}
              policies={policies}
              onApprove={onApprove}
              onDeny={onDeny}
              onApproveRemember={onApproveRemember}
            />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
