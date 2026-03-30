"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useConversations } from "@/lib/hooks/useConversations";
import { useLabProgress } from "@/lib/hooks/useLabProgress";
import { LABS } from "@/lib/labs/curriculum";
import { LabSidebar } from "@/components/sidebar/LabSidebar";
import { LabInstructionPanel } from "@/components/labs/LabInstructionPanel";
import { QuizPanel } from "@/components/labs/QuizPanel";
import { ActiveChatView } from "@/components/chat/ActiveChatView";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { ModelComparisonSelector } from "@/components/chat/ModelComparisonSelector";
import { ComparisonView } from "@/components/chat/ComparisonView";
import { SettingsDialog } from "@/components/layout/SettingsDialog";
import { Button } from "@/components/ui/button";

export default function Home() {
  const {
    conversations,
    createConversation,
    deleteConversation,
    renameConversation,
  } = useConversations();

  const {
    progress,
    markCompleted,
    getLabProgress,
    completedCount,
    totalLabs,
  } = useLabProgress();

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("anthropic:claude-opus-4-6");
  const [showToolCalls, setShowToolCalls] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonModels, setComparisonModels] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Lab state
  const [activeLabId, setActiveLabId] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [prefillInput, setPrefillInput] = useState<string | null>(null);
  const [freeMode, setFreeMode] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const activeLab = activeLabId ? LABS.find((l) => l.id === activeLabId) ?? null : null;
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const handleSelectLab = useCallback(async (labId: string) => {
    const lab = LABS.find((l) => l.id === labId);
    if (!lab) return;
    setActiveLabId(labId);
    setShowQuiz(false);
    setFreeMode(false);
    setComparisonMode(false);
    if (lab.recommendedModel) setSelectedModel(lab.recommendedModel);
    const conv = await createConversation(`Lab ${lab.number}: ${lab.title}`, lab.recommendedModel || selectedModel);
    setActiveConversationId(conv.id);
  }, [createConversation, selectedModel]);

  const handleSwitchToFreeMode = useCallback(() => {
    setActiveLabId(null);
    setShowQuiz(false);
    setFreeMode(true);
  }, []);

  const handleNewConversation = useCallback(async () => {
    const conv = await createConversation(undefined, selectedModel);
    setActiveConversationId(conv.id);
    setActiveLabId(null);
    setFreeMode(true);
  }, [createConversation, selectedModel]);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setActiveLabId(null);
    setFreeMode(true);
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    await deleteConversation(id);
    if (activeConversationId === id) setActiveConversationId(null);
  }, [deleteConversation, activeConversationId]);

  const handleToggleComparison = useCallback(() => {
    setComparisonMode((prev) => !prev);
  }, []);

  const handleQuizComplete = useCallback((score: number, passed: boolean) => {
    if (activeLabId) markCompleted(activeLabId, score, passed);
  }, [activeLabId, markCompleted]);

  return (
    <div className="flex h-full overflow-hidden">
      {sidebarOpen && (
        <div className="w-64 shrink-0">
          <LabSidebar
            activeLabId={activeLabId}
            onSelectLab={handleSelectLab}
            progress={progress}
            freeMode={freeMode}
            onSwitchToFreeMode={handleSwitchToFreeMode}
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onCreateConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={renameConversation}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-[#2c3e50] text-white shrink-0">
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "◀" : "▶"}
          </Button>

          <div className="flex items-center gap-2">
            <Image src="/vocareum-logo.webp" alt="Vocareum" width={24} height={24} />
            <h1 className="text-sm font-semibold text-white">
              {activeLab ? `Lab ${activeLab.number}: ${activeLab.title}` : "Vocareum Agent"}
            </h1>
          </div>

          <div className="flex-1" />

          {comparisonMode ? (
            <ModelComparisonSelector selected={comparisonModels} onChange={setComparisonModels} />
          ) : (
            <ModelSelector value={selectedModel} onChange={setSelectedModel} />
          )}

          <Button variant="ghost" size="sm" className={comparisonMode ? "bg-red-500/20 text-red-300 hover:bg-red-500/30" : "text-white/70 hover:text-white hover:bg-white/10"} onClick={handleToggleComparison}>
            {comparisonMode ? "✕ Exit Compare" : "⚖️ Compare"}
          </Button>

          {mounted && !comparisonMode && activeConversationId && (
            <>
              <Button variant="ghost" size="sm" className={`hover:bg-white/10 ${showToolCalls ? "bg-white/20 text-white" : "text-white/70 hover:text-white"}`} onClick={() => setShowToolCalls(!showToolCalls)}>
                🔧 Tools
              </Button>
              <Button variant="ghost" size="sm" className={`hover:bg-white/10 ${showAgentPanel ? "bg-white/20 text-white" : "text-white/70 hover:text-white"}`} onClick={() => setShowAgentPanel(!showAgentPanel)}>
                🤖 Agents
              </Button>
            </>
          )}

          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => setShowSettings(true)}>
            ⚙️
          </Button>
        </header>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {comparisonMode ? (
            <>
              {/* Lab instructions stay visible throughout comparison mode */}
              {activeLab && (
                <div className="w-80 shrink-0 border-r border-gray-200 h-full overflow-hidden">
                  {showQuiz ? (
                    <QuizPanel quiz={activeLab.quiz} labTitle={activeLab.title} labNumber={activeLab.number} onComplete={handleQuizComplete} onBack={() => setShowQuiz(false)} />
                  ) : (
                    <LabInstructionPanel lab={activeLab} onStartQuiz={() => setShowQuiz(true)} onSuggestedPrompt={(prompt) => setPrefillInput(prompt)} progress={getLabProgress(activeLab.id)} comparisonMode={comparisonMode} onEnterComparisonMode={handleToggleComparison} />
                  )}
                </div>
              )}
              {comparisonModels.length >= 2 ? (
                <ComparisonView
                  models={comparisonModels}
                  createConversation={createConversation}
                  columnLabels={activeLab?.id === "lab-13" ? ["🔵 Single Agent (no delegation)", "🟢 Multi-Agent (with specialists)"] : undefined}
                  prefillInput={prefillInput}
                  onPrefillConsumed={() => setPrefillInput(null)}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-white">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-4">⚖️</div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Model Comparison</h2>
                    <p className="text-sm max-w-md mb-2">Select 2–3 models from the dropdown above to compare responses side by side.</p>
                    <p className="text-xs text-gray-400">{comparisonModels.length === 0 ? "No models selected yet" : "Select at least one more model"}</p>
                  </div>
                </div>
              )}
            </>
          ) : activeConversationId && activeConversation ? (
            <>
              {activeLab && (
                <div className="w-80 shrink-0 border-r border-gray-200 h-full overflow-hidden">
                  {showQuiz ? (
                    <QuizPanel quiz={activeLab.quiz} labTitle={activeLab.title} labNumber={activeLab.number} onComplete={handleQuizComplete} onBack={() => setShowQuiz(false)} />
                  ) : (
                    <LabInstructionPanel lab={activeLab} onStartQuiz={() => setShowQuiz(true)} onSuggestedPrompt={(prompt) => setPrefillInput(prompt)} progress={getLabProgress(activeLab.id)} comparisonMode={comparisonMode} onEnterComparisonMode={handleToggleComparison} />
                  )}
                </div>
              )}
              <ActiveChatView
                conversationId={activeConversationId}
                model={selectedModel}
                showToolCalls={showToolCalls}
                showAgentPanel={showAgentPanel}
                workspaceId={activeConversation.workspaceId}
                prefillInput={prefillInput}
                onPrefillConsumed={() => setPrefillInput(null)}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center text-gray-500 max-w-lg">
                <Image src="/vocareum-logo.webp" alt="Vocareum" width={80} height={80} className="mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">Vocareum AI Agent Lab</h2>
                <p className="text-sm mb-6 text-gray-500">Learn how to operate agentic AI systems through hands-on labs. Select a lab from the sidebar to begin, or start a free chat.</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => handleSelectLab("lab-01")} className="bg-[#5ba4b5] hover:bg-[#4a8fa0] text-white">Start Lab 1</Button>
                  <Button variant="outline" onClick={handleNewConversation} className="border-gray-300 text-gray-600">Free Chat</Button>
                </div>
                <p className="text-xs text-gray-400 mt-4">{completedCount}/{totalLabs} labs completed</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
}
