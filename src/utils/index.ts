import { Collection, Problem } from "@site/src/types";

export const filterProblems = (
  problems: Problem[],
  collection: Collection
): Problem[] => {
  if (collection === "All") return problems;
  return problems.filter((problem) => problem[collection.toLowerCase()]);
};

export const getDifficultyClass = (difficulty: string): string => {
  switch (difficulty) {
    case "Easy":
      return "text-green-600";
    case "Medium":
      return "text-yellow-500";
    case "Hard":
      return "text-red-600";
    default:
      return "text-gray-500";
  }
};
