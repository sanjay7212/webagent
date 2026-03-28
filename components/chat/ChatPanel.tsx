"use client";

import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import type { UIMessage } from "ai";
import type { ClientToolPolicy } from "@/lib/tools/permissions";

interface ChatPanelProps {
  messages: UIMessage[];
  isLoading: boolean;
  input: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  policies?: ClientToolPolicy[];
  onApprove?: (toolCallId: string) => void;
  onDeny?: (toolCallId: string) => void;
  onApproveRemember?: (toolCallId: string, toolName: string, args: Record<string, unknown>) => void;
}

export function ChatPanel({
  messages,
  isLoading,
  input,
  onChange,
  onSubmit,
  onStop,
  policies,
  onApprove,
  onDeny,
  onApproveRemember,
}: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MessageList
        messages={messages}
        isLoading={isLoading}
        policies={policies}
        onApprove={onApprove}
        onDeny={onDeny}
        onApproveRemember={onApproveRemember}
      />
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
