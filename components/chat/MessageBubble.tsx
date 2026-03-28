"use client";

import { StreamingText } from "./StreamingText";
import { ToolCallBlock } from "./ToolCallBlock";
import type { UIMessage } from "ai";
import type { ClientToolPolicy } from "@/lib/tools/permissions";

interface MessageBubbleProps {
  message: UIMessage;
  policies?: ClientToolPolicy[];
  onApprove?: (toolCallId: string) => void;
  onDeny?: (toolCallId: string) => void;
  onApproveRemember?: (toolCallId: string, toolName: string, args: Record<string, unknown>) => void;
}

export function MessageBubble({ message, policies, onApprove, onDeny, onApproveRemember }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[85%] ${
          isUser
            ? "bg-indigo-400/90 text-white rounded-2xl rounded-br-md px-4 py-2"
            : "bg-zinc-800 text-zinc-100 rounded-2xl rounded-bl-md px-4 py-3"
        }`}
      >
        {/* Role indicator */}
        <div
          className={`text-xs mb-1 ${isUser ? "text-indigo-200" : "text-zinc-400"}`}
        >
          {isUser ? "You" : "Assistant"}
        </div>

        {/* Render parts */}
        {message.parts.map((part, idx) => {
          if (part.type === "text") {
            return (
              <div key={idx}>
                {isUser ? (
                  <p className="text-sm whitespace-pre-wrap">{part.text}</p>
                ) : (
                  <StreamingText content={part.text} />
                )}
              </div>
            );
          }

          // Handle tool invocation parts (dynamic-tool or tool-*)
          if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
            const toolPart = part as {
              type: string;
              toolName?: string;
              toolCallId: string;
              state: string;
              input?: Record<string, unknown>;
              output?: unknown;
            };
            const toolName =
              toolPart.toolName || part.type.replace("tool-", "");
            return (
              <ToolCallBlock
                key={toolPart.toolCallId}
                toolName={toolName}
                args={(toolPart.input as Record<string, unknown>) || {}}
                state={toolPart.state}
                result={toolPart.output}
                toolCallId={toolPart.toolCallId}
                policies={policies}
                onApprove={onApprove}
                onDeny={onDeny}
                onApproveRemember={onApproveRemember}
              />
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
