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
    <div className="border-t border-zinc-700 bg-zinc-900 p-4">
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
          className="min-h-[44px] max-h-[200px] resize-none bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-indigo-400"
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
            className="shrink-0 bg-indigo-400 hover:bg-indigo-500 text-zinc-950"
            disabled={!input.trim()}
          >
            Send
          </Button>
        )}
      </form>
    </div>
  );
}
