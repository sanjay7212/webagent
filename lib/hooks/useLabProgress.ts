"use client";

import { useState, useCallback, useEffect } from "react";
import type { LabProgress } from "@/lib/labs/types";

const STORAGE_KEY = "vocareum-lab-progress";

export function useLabProgress() {
  const [progress, setProgress] = useState<Record<string, LabProgress>>({});
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
    setLoaded(true);
  }, []);

  // Save to localStorage on change (only after initial load)
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  }, [progress, loaded]);

  const markCompleted = useCallback(
    (labId: string, score: number, passed: boolean) => {
      setProgress((prev) => ({
        ...prev,
        [labId]: {
          labId,
          completed: passed,
          quizScore: score,
          quizPassed: passed,
          completedAt: passed ? new Date().toISOString() : null,
        },
      }));
    },
    []
  );

  const resetProgress = useCallback(() => {
    setProgress({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getLabProgress = useCallback(
    (labId: string): LabProgress | undefined => {
      return progress[labId];
    },
    [progress]
  );

  const completedCount = Object.values(progress).filter(
    (p) => p.quizPassed
  ).length;

  return {
    progress,
    loaded,
    markCompleted,
    resetProgress,
    getLabProgress,
    completedCount,
    totalLabs: 10,
  };
}
