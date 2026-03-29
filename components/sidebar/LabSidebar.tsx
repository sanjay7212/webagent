"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LABS } from "@/lib/labs/curriculum";
import type { LabProgress } from "@/lib/labs/types";
import type { Conversation } from "@/lib/types";

interface LabSidebarProps {
  activeLabId: string | null;
  onSelectLab: (labId: string) => void;
  progress: Record<string, LabProgress>;
  freeMode: boolean;
  onSwitchToFreeMode: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
}

function LabStatusIcon({ progress }: { progress: LabProgress | undefined }) {
  if (!progress) {
    return <span className="text-gray-500 text-sm">○</span>;
  }
  if (progress.quizPassed) {
    return <span className="text-green-500 text-sm font-bold">✓</span>;
  }
  if (progress.quizScore !== null) {
    return <span className="text-orange-500 text-sm">⚠</span>;
  }
  return <span className="text-gray-500 text-sm">○</span>;
}

export function LabSidebar({
  activeLabId,
  onSelectLab,
  progress,
  freeMode,
  onSwitchToFreeMode,
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onRenameConversation,
}: LabSidebarProps) {
  const [freeChatOpen, setFreeChatOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const completedCount = LABS.filter(
    (lab) => progress[lab.id]?.quizPassed
  ).length;

  const startRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const finishRename = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="w-64 h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header with progress */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-800 mb-2">
          Lab Curriculum
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#5ba4b5] rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / LABS.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {completedCount}/{LABS.length}
          </span>
        </div>
      </div>

      {/* Lab list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {LABS.map((lab) => {
            const isActive = !freeMode && activeLabId === lab.id;
            const labProgress = progress[lab.id];

            return (
              <button
                key={lab.id}
                onClick={() => onSelectLab(lab.id)}
                className={`w-full flex items-center gap-2 rounded-md px-2 py-2 text-left transition-colors ${
                  isActive
                    ? "bg-[#5ba4b5]/10 text-[#5ba4b5] font-medium"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {isActive ? (
                  <span className="text-[#5ba4b5] text-sm">●</span>
                ) : (
                  <LabStatusIcon progress={labProgress} />
                )}
                <span className="text-xs text-gray-500 w-4 text-right">
                  {lab.number}
                </span>
                <span className="flex-1 text-sm truncate">{lab.title}</span>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Free Chat collapsible section */}
      <div className="border-t border-gray-200">
        <button
          onClick={() => {
            setFreeChatOpen(!freeChatOpen);
            if (!freeMode) onSwitchToFreeMode();
          }}
          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
            freeMode
              ? "text-[#5ba4b5] font-medium bg-[#5ba4b5]/5"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <span>Free Chat</span>
          <span className="text-xs text-gray-400">
            {freeChatOpen ? "▾" : "▸"}
          </span>
        </button>

        {freeChatOpen && (
          <div className="border-t border-gray-100">
            <div className="p-2">
              <Button
                onClick={onCreateConversation}
                className="w-full bg-[#5ba4b5] hover:bg-[#4a8fa0] text-white text-xs"
                size="sm"
              >
                + New Conversation
              </Button>
            </div>

            <ScrollArea className="max-h-48">
              <div className="px-2 pb-2 space-y-0.5">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer transition-colors ${
                      freeMode && activeConversationId === conv.id
                        ? "bg-[#5ba4b5]/10 text-[#5ba4b5] font-medium"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    }`}
                    onClick={() => onSelectConversation(conv.id)}
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
                        className="flex-1 bg-gray-100 text-gray-900 text-xs px-1 rounded border border-gray-300 outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="flex-1 text-xs truncate">
                        {conv.title}
                      </span>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-700 px-1 text-xs"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        ⋯
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="bg-gray-100 border-gray-200"
                        align="end"
                      >
                        <DropdownMenuItem
                          className="text-gray-800 focus:bg-gray-200 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            startRename(conv);
                          }}
                        >
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:bg-gray-200 focus:text-red-600 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}

                {conversations.length === 0 && (
                  <p className="text-gray-500 text-xs text-center py-3">
                    No conversations yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
