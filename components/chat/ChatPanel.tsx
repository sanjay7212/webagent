"use client";

import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import type { UIMessage } from "ai";

interface ChatPanelProps {
  messages: UIMessage[];
  isLoading: boolean;
  input: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
}

export function ChatPanel({
  messages,
  isLoading,
  input,
  onChange,
  onSubmit,
  onStop,
}: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput
        input={input}
        onChange={onChange}
        onSubmit={onSubmit}
        isLoading={isLoading}
        onStop={onStop}
      />
    </div>
  );
}
