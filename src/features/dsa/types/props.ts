import { Problem } from "./common";

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