"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Quiz } from "@/lib/labs/types";

interface QuizPanelProps {
  quiz: Quiz;
  labTitle: string;
  labNumber: number;
  onComplete: (score: number, passed: boolean) => void;
  onBack: () => void;
}

export function QuizPanel({
  quiz,
  labTitle,
  labNumber,
  onComplete,
  onBack,
}: QuizPanelProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const totalQuestions = quiz.questions.length;
  const allAnswered = quiz.questions.every((q) => answers[q.id] !== undefined);
  const passed = score !== null && score >= quiz.passingScore;

  function handleSelect(questionId: string, optionIndex: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  function handleSubmit() {
    let correct = 0;
    for (const q of quiz.questions) {
      if (answers[q.id] === q.correctIndex) {
        correct++;
      }
    }
    setScore(correct);
    setSubmitted(true);
    onComplete(correct, correct >= quiz.passingScore);
  }

  function handleRetake() {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
  }

  return (
    <div className="flex h-full flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <button
          onClick={onBack}
          className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <span>←</span>
          <span>Back to Instructions</span>
        </button>
        <h2 className="text-sm font-semibold text-gray-900">
          Quiz: Lab {labNumber} — {labTitle}
        </h2>
      </div>

      {/* Questions */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col gap-6 p-4">
          {quiz.questions.map((question, qIndex) => {
            const selectedIndex = answers[question.id];
            const isCorrect =
              submitted && selectedIndex === question.correctIndex;
            const isWrong =
              submitted &&
              selectedIndex !== undefined &&
              selectedIndex !== question.correctIndex;

            return (
              <div key={question.id} className="flex flex-col gap-2">
                <p className="text-sm font-medium text-gray-900">
                  {qIndex + 1}. {question.question}
                </p>

                <div className="flex flex-col gap-1.5">
                  {question.options.map((option, oIndex) => {
                    const isSelected = selectedIndex === oIndex;
                    const isCorrectOption =
                      submitted && oIndex === question.correctIndex;
                    const isWrongSelection =
                      submitted && isSelected && !isCorrectOption;

                    let borderClass = "border-gray-200";
                    if (submitted) {
                      if (isCorrectOption) borderClass = "border-green-500";
                      else if (isWrongSelection) borderClass = "border-red-500";
                    } else if (isSelected) {
                      borderClass = "border-teal-500";
                    }

                    let bgClass = "bg-white";
                    if (submitted) {
                      if (isCorrectOption) bgClass = "bg-green-50";
                      else if (isWrongSelection) bgClass = "bg-red-50";
                    } else if (isSelected) {
                      bgClass = "bg-teal-50";
                    }

                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleSelect(question.id, oIndex)}
                        disabled={submitted}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${borderClass} ${bgClass} ${
                          submitted
                            ? "cursor-default"
                            : "cursor-pointer hover:border-teal-300 hover:bg-teal-50/50"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? submitted
                                ? isCorrectOption
                                  ? "border-green-500 bg-green-500"
                                  : "border-red-500 bg-red-500"
                                : "border-teal-500 bg-teal-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <span className="block h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </span>
                        <span className="text-gray-700">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation after submission */}
                {submitted && (isCorrect || isWrong) && (
                  <p className="mt-1 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    {question.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-3">
        {submitted && score !== null ? (
          <div className="flex flex-col gap-3">
            {/* Score */}
            <p className="text-center text-sm font-semibold text-gray-900">
              You scored {score}/{totalQuestions}
            </p>

            {/* Pass/fail banner */}
            {passed ? (
              <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-center text-sm text-green-800">
                Congratulations! You passed.
              </div>
            ) : (
              <div className="rounded-md bg-orange-50 border border-orange-200 px-3 py-2 text-center text-sm text-orange-800">
                You scored {score}/{totalQuestions}. You need{" "}
                {quiz.passingScore} to pass. Review the explanations and try
                again.
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              {!passed && (
                <Button
                  onClick={handleRetake}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  Retake Quiz
                </Button>
              )}
              <Button variant="outline" onClick={onBack} className="w-full">
                Back to Instructions
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
          >
            Submit Quiz
          </Button>
        )}
      </div>
    </div>
  );
}
