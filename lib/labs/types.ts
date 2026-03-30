export interface Lab {
  id: string;
  number: number;
  title: string;
  description: string;
  objectives: string[];
  steps: LabStep[];
  suggestedPrompts: string[];
  quiz: Quiz;
  recommendedModel?: string;
  recommendedToolPolicy?: "permissive" | "balanced" | "strict";
  /** If true, the instructions panel shows a CTA to enter Comparison Mode */
  requiresComparisonMode?: boolean;
  /** Optional per-prompt target labels (e.g. "← Left panel", "Right panel →") */
  promptTargets?: string[];
}

export interface LabStep {
  title: string;
  instruction: string;
  hint?: string;
}

export interface Quiz {
  passingScore: number;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LabProgress {
  labId: string;
  completed: boolean;
  quizScore: number | null;
  quizPassed: boolean;
  completedAt: string | null;
}
