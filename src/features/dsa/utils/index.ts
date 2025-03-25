import { Collection, Problem } from "../types";

export const filterProblems = (
  problems: Problem[],
  collection: Collection
): Problem[] => {
  if (collection === "All") return problems;
  return problems.filter((problem) => problem[collection.toLowerCase()]);
};
