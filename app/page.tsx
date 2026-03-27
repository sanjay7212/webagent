"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useConversations } from "@/lib/hooks/useConversations";
import { ConversationSidebar } from "@/components/sidebar/ConversationSidebar";
import { ActiveChatView } from "@/components/chat/ActiveChatView";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { ModelComparisonSelector } from "@/components/chat/ModelComparisonSelector";
import { ComparisonView } from "@/components/chat/ComparisonView";
import { CodeViewer } from "@/components/editor/CodeViewer";
import { SettingsDialog } from "@/components/layout/SettingsDialog";
import { Button } from "@/components/ui/button";

export default function Home() {
  const {
    conversations,
    createConversation,
    deleteConversation,
    renameConversation,
  } = useConversations();

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [selectedModel, setSelectedModel] = useState(
    "anthropic:claude-opus-4-6"
  );
  const [showFiles, setShowFiles] = useState(false);
  const [showToolCalls, setShowToolCalls] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewingFile, setViewingFile] = useState<{
    path: string;
    content: string;
  } | null>(null);

  // Comparison mode state
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonModels, setComparisonModels] = useState<string[]>([]);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  const handleNewConversation = useCallback(async () => {
    const conv = await createConversation(undefined, selectedModel);
    setActiveConversationId(conv.id);
  }, [createConversation, selectedModel]);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setViewingFile(null);
  }, []);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      await deleteConversation(id);
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    },
    [deleteConversation, activeConversationId]
  );

  const handleFileSelect = useCallback((path: string, content: string) => {
    setViewingFile({ path, content });
  }, []);

  const handleToggleComparison = useCallback(() => {
    setComparisonMode((prev) => !prev);
    if (!comparisonMode) {
      // Entering comparison mode — clear single chat state
      setViewingFile(null);
    }
  }, [comparisonMode]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar - Conversations */}
      {sidebarOpen && (
        <div className="w-64 shrink-0">
          <ConversationSidebar
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={handleSelectConversation}
            onCreate={handleNewConversation}
            onDelete={handleDeleteConversation}
            onRename={renameConversation}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-2 border-b border-zinc-700 bg-zinc-900">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-zinc-200"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "◀" : "▶"}
          </Button>

          <div className="flex items-center gap-2">
            <Image
              src="/vocareum-logo.webp"
              alt="Vocareum"
              width={24}
              height={24}
            />
            <h1 className="text-sm font-semibold text-zinc-200">
              Vocareum Agent
            </h1>
          </div>

          <div className="flex-1" />

          {/* Model selector — switches between single and comparison */}
          {comparisonMode ? (
            <ModelComparisonSelector
              selected={comparisonModels}
              onChange={setComparisonModels}
            />
          ) : (
            <ModelSelector value={selectedModel} onChange={setSelectedModel} />
          )}

          {/* Compare toggle */}
          <Button
            variant="ghost"
            size="sm"
            className={
              comparisonMode
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300"
                : "text-zinc-400 hover:text-zinc-200"
            }
            onClick={handleToggleComparison}
          >
            {comparisonMode ? "✕ Exit Compare" : "⚖️ Compare"}
          </Button>

          {/* Tool calls toggle (only in single chat mode) */}
          {!comparisonMode && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className={`text-zinc-400 hover:text-zinc-200 ${
                  showToolCalls ? "bg-zinc-700" : ""
                }`}
                onClick={() => setShowToolCalls(!showToolCalls)}
              >
                🔧 Tools
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`text-zinc-400 hover:text-zinc-200 ${
                  showAgentPanel ? "bg-zinc-700" : ""
                }`}
                onClick={() => setShowAgentPanel(!showAgentPanel)}
              >
                🤖 Agents
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            className={`text-zinc-400 hover:text-zinc-200 ${
              showFiles ? "bg-zinc-700" : ""
            }`}
            onClick={() => setShowFiles(!showFiles)}
          >
            📁 Files
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-zinc-200"
            onClick={() => setShowSettings(true)}
          >
            ⚙️
          </Button>
        </header>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {comparisonMode && comparisonModels.length >= 2 ? (
            /* Comparison Mode */
            <ComparisonView
              models={comparisonModels}
              createConversation={createConversation}
            />
          ) : comparisonMode ? (
            /* Comparison mode but not enough models selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-zinc-500">
                <div className="text-4xl mb-4">⚖️</div>
                <h2 className="text-xl font-semibold text-zinc-300 mb-2">
                  Model Comparison
                </h2>
                <p className="text-sm max-w-md mb-2">
                  Select 2-3 models from the dropdown above to compare their
                  responses side by side.
                </p>
                <p className="text-xs text-zinc-600">
                  {comparisonModels.length === 0
                    ? "No models selected"
                    : "Select at least one more model"}
                </p>
              </div>
            </div>
          ) : viewingFile ? (
            /* Code Viewer */
            <CodeViewer
              filePath={viewingFile.path}
              content={viewingFile.content}
              onClose={() => setViewingFile(null)}
            />
          ) : activeConversationId && activeConversation ? (
            /* Active Chat with Tool Panel + File Explorer */
            <ActiveChatView
              conversationId={activeConversationId}
              model={selectedModel}
              showToolCalls={showToolCalls}
              showAgentPanel={showAgentPanel}
              showFiles={showFiles}
              workspaceId={activeConversation.workspaceId}
              onFileSelect={handleFileSelect}
            />
          ) : (
            /* Welcome screen */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-zinc-500">
                <Image
                  src="/vocareum-logo.webp"
                  alt="Vocareum"
                  width={80}
                  height={80}
                  className="mx-auto mb-6"
                />
                <h2 className="text-2xl font-semibold text-zinc-300 mb-3">
                  Vocareum AI Agent
                </h2>
                <p className="text-sm max-w-md mb-6">
                  A general-purpose AI agent supporting Claude, GPT, and Gemini
                  models. Create a conversation to get started.
                </p>
                <Button
                  onClick={handleNewConversation}
                  className="bg-indigo-400 hover:bg-indigo-500 text-zinc-950"
                >
                  Start New Conversation
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}
