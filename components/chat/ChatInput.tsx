"use client";

import { useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onStop?: () => void;
}

export function ChatInput({
  input,
  onChange,
  onSubmit,
  isLoading,
  onStop,
}: ChatInputProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isLoading && input.trim()) {
          formRef.current?.requestSubmit();
        }
      }
    },
    [isLoading, input]
  );

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="max-w-4xl mx-auto flex gap-2 items-end"
      >
        <Textarea
          value={input}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask Vocareum Agent anything..."
          className="min-h-[44px] max-h-[200px] resize-none bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-500 focus-visible:ring-[#5ba4b5]"
          rows={1}
        />
        {isLoading ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="shrink-0"
            onClick={onStop}
          >
            Stop
          </Button>
        ) : (
          <Button
            type="submit"
            size="sm"
            className="shrink-0 bg-[#5ba4b5] hover:bg-[#4a8fa0] text-white"
            disabled={!input.trim()}
          >
            Send
          </Button>
        )}
      </form>
    </div>
  );
}
