"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Conversation } from "@/lib/types";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
}: ConversationSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const finishRename = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <Button
          onClick={onCreate}
          className="w-full bg-[#5ba4b5] hover:bg-[#4a8fa0] text-white text-sm"
          size="sm"
        >
          + New Conversation
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center gap-1 rounded-md px-2 py-2 cursor-pointer transition-colors ${
                activeId === conv.id
                  ? "bg-[#5ba4b5]/10 text-[#5ba4b5] font-medium"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              }`}
              onClick={() => onSelect(conv.id)}
            >
              {editingId === conv.id ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={finishRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") finishRename();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-900 text-sm px-1 rounded border border-gray-300 outline-none"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 text-sm truncate">{conv.title}</span>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700 px-1"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  ⋯
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="bg-gray-100 border-gray-200"
                  align="end"
                >
                  <DropdownMenuItem
                    className="text-gray-800 focus:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(conv);
                    }}
                  >
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:bg-gray-200 focus:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(conv.id);
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}

          {conversations.length === 0 && (
            <p className="text-gray-500 text-xs text-center py-4">
              No conversations yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
