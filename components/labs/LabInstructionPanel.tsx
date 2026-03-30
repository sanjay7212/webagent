"use client";

import { useState } from "react";
import { Lab, LabProgress } from "@/lib/labs/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Lightbulb,
} from "lucide-react";

interface LabInstructionPanelProps {
  lab: Lab;
  onStartQuiz: () => void;
  onSuggestedPrompt: (prompt: string) => void;
  progress: LabProgress | undefined;
  comparisonMode?: boolean;
  onEnterComparisonMode?: () => void;
}

export function LabInstructionPanel({
  lab,
  onStartQuiz,
  onSuggestedPrompt,
  progress,
  comparisonMode,
  onEnterComparisonMode,
}: LabInstructionPanelProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(
    new Set([0])
  );

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const quizAttempted = progress?.quizScore !== null && progress?.quizScore !== undefined;
  const quizPassed = progress?.quizPassed ?? false;
  const quizScore = progress?.quizScore ?? 0;

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-5 space-y-6">
          {/* Lab number badge + title */}
          <div>
            <Badge
              className="mb-2 text-white text-xs font-medium"
              style={{ backgroundColor: "#5ba4b5" }}
            >
              Lab {lab.number}
            </Badge>
            <h2 className="text-base font-semibold text-gray-900">
              {lab.title}
            </h2>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-800 leading-relaxed">
            {lab.description}
          </p>

          {/* Comparison Mode banner — shown when lab requires it */}
          {lab.requiresComparisonMode && (
            comparisonMode ? (
              <div className="flex items-center gap-2 rounded-lg bg-[#5ba4b5]/10 border border-[#5ba4b5]/30 px-3 py-2">
                <span className="text-sm">⚖️</span>
                <span className="text-xs font-medium text-[#3d7a8a]">Comparison Mode is active</span>
              </div>
            ) : (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
                <p className="text-xs font-semibold text-amber-800">⚖️ This lab requires Comparison Mode</p>
                <p className="text-xs text-amber-700">You need two side-by-side panels to compare single-agent vs multi-agent outputs.</p>
                <button
                  onClick={onEnterComparisonMode}
                  className="w-full text-xs font-semibold py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                >
                  Open Comparison Mode →
                </button>
              </div>
            )
          )}

          {/* Objectives */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Objectives
            </h3>
            <ul className="space-y-2">
              {lab.objectives.map((objective, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                  <CheckCircle
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: "#5ba4b5" }}
                  />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Steps
            </h3>
            <div className="space-y-2">
              {lab.steps.map((step, index) => {
                const isExpanded = expandedSteps.has(index);
                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleStep(index)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-gray-800">
                        {index + 1}. {step.title}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 ml-6">
                        <p className="text-sm text-gray-800 leading-relaxed">
                          {step.instruction}
                        </p>
                        {step.hint && (
                          <div className="mt-2 flex items-start gap-2 rounded-md bg-yellow-50 border border-yellow-200 p-2.5">
                            <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                            <p className="text-xs text-yellow-800 leading-relaxed">
                              {step.hint}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suggested Prompts */}
          {lab.suggestedPrompts.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Try These Prompts
              </h3>
              <div className="flex flex-col gap-2">
                {lab.suggestedPrompts.map((prompt, i) => {
                  const target = lab.promptTargets?.[i];
                  return (
                    <button
                      key={i}
                      onClick={() => onSuggestedPrompt(prompt)}
                      className="text-left rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors overflow-hidden"
                    >
                      {target && (
                        <div className="px-2.5 py-1 bg-gray-100 border-b border-gray-200 text-xs font-semibold text-[#3d7a8a]">
                          {target}
                        </div>
                      )}
                      <p className="text-xs px-2.5 py-1.5 text-gray-700 line-clamp-2">
                        {prompt}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quiz / Completion area */}
          <div className="pt-2 pb-2">
            {quizPassed ? (
              <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Completed ✓ ({quizScore}/{lab.quiz.questions.length})
                </span>
              </div>
            ) : quizAttempted && !quizPassed ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-orange-50 border border-orange-200">
                  <span className="text-sm font-medium text-orange-700">
                    Try Again ({quizScore}/{lab.quiz.questions.length})
                  </span>
                </div>
                <Button
                  onClick={onStartQuiz}
                  className="w-full text-white"
                  style={{ backgroundColor: "#5ba4b5" }}
                >
                  Take Quiz
                </Button>
              </div>
            ) : (
              <Button
                onClick={onStartQuiz}
                className="w-full text-white"
                style={{ backgroundColor: "#5ba4b5" }}
              >
                Take Quiz
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
