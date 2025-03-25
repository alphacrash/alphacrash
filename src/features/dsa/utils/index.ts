import { Collection, Problem } from "../types";

export const filterProblems = (
  problems: Problem[],
  collection: Collection
): Problem[] => {
  switch (collection) {
    case "alpha":
      return problems.filter((problem) => problem.alpha);
    case "Blind75":
      return problems.filter((problem) => problem.blind75);
    case "Neetcode150":
      return problems.filter((problem) => problem.neetcode150);
    case "Neetcode250":
      return problems.filter((problem) => problem.neetcode250);
    default:
      return problems;
  }
};