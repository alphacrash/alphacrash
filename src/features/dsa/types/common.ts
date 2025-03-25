export interface BaseProps {
  isChecked?: boolean;
  isExpanded?: boolean;
  difficulty?: string;
  onClick?: () => void;
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

export type Collection = "All" | "alpha" | "Blind75" | "Neetcode150" | "Neetcode250";