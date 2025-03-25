export interface BaseProps {
  isChecked?: boolean;
  isExpanded?: boolean;
  difficulty?: string;
  onClick?: () => void;
}

export type Collection =
  | "All"
  | "alpha"
  | "Blind75"
  | "Neetcode150"
  | "Neetcode250";

export interface CheckmarkProps {
  isChecked: boolean;
  onClick: () => void;
}

export interface DifficultyProps {
  difficulty: string;
}

export interface ExpandDirectionProps {
  isExpanded: boolean;
}

export interface Problem {
  alpha?: boolean;
  neetcode250?: boolean;
  neetcode150?: boolean;
  blind75?: boolean;
  problem: string;
  pattern: string;
  link: string;
  difficulty: string;
  code: string;
}

export interface ProblemListProps {
  problems: Problem[];
}

export interface ProblemGroupProps {
  completedProblems: Set<string>;
  setCompletedProblems: React.Dispatch<React.SetStateAction<Set<string>>>;
  expandedPatterns: Set<string>;
  setExpandedPatterns: React.Dispatch<React.SetStateAction<Set<string>>>;
  groupedProblems: Record<string, Problem[]>;
}

export interface ProblemRowProps {
  completedProblems: Set<string>;
  setCompletedProblems: React.Dispatch<React.SetStateAction<Set<string>>>;
  problem: Problem;
}

export interface ProgressBarProps {
  progress: number;
  isFull: boolean;
}
