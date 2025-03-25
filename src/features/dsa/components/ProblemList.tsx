import { Collection, Problem } from "@site/src/types";
import { filterProblems } from "@site/src/utils";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import ProblemGroup from "./ProblemGroup";
import ProgressBar from "./ui/ProgressBar";

interface ProblemListProps {
  problems: Problem[];
}

const ProblemList = ({ problems }: ProblemListProps) => {
  const [completedProblems, setCompletedProblems] = useState<Set<string>>(
    new Set()
  );
  const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(
    new Set()
  );
  const [selectedCollection, setSelectedCollection] =
    useState<Collection>("Neetcode150");

  useEffect(() => {
    const saved = localStorage.getItem("completedProblems");
    if (saved) {
      setCompletedProblems(new Set(JSON.parse(saved)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "completedProblems",
      JSON.stringify(Array.from(completedProblems))
    );
  }, [completedProblems]);

  const toggleAllPatterns = () => {
    const filteredProblems = filterProblems(problems, selectedCollection);
    const allPatterns = Array.from(
      new Set(filteredProblems.map((p) => p.pattern))
    );
    setExpandedPatterns((prev) => {
      if (prev.size === allPatterns.length) {
        return new Set();
      }
      return new Set(allPatterns);
    });
  };

  const filteredProblems = filterProblems(problems, selectedCollection);
  const groupedProblems = filteredProblems.reduce((acc, problem) => {
    if (!acc[problem.pattern]) {
      acc[problem.pattern] = [];
    }
    acc[problem.pattern].push(problem);
    return acc;
  }, {} as Record<string, Problem[]>);

  const totalProblems = filteredProblems.length;
  const completedCount = [...completedProblems].filter((code) =>
    filteredProblems.some((p) => p.code === code)
  ).length;
  const overallProgress =
    totalProblems === 0 ? 0 : (completedCount / totalProblems) * 100;
  const isAnyPatternExpanded = expandedPatterns?.size > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Overall Progress
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={selectedCollection}
                onChange={(e) =>
                  setSelectedCollection(e.target.value as Collection)
                }
                className="appearance-none cursor-pointer py-3 px-4 pe-9 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
              >
                <option value="All">All</option>
                <option value="alpha">Alpha</option>
                <option value="Blind75">Blind 75</option>
                <option value="Neetcode150">Neetcode 150</option>
                <option value="Neetcode250">Neetcode 250</option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div
              onClick={toggleAllPatterns}
              className="cursor-pointer py-3 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border-solid border-gray-200 bg-white text-gray-800 hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
            >
              {isAnyPatternExpanded ? (
                <>
                  <ChevronUp className="w-5 h-5" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="w-5 h-5" />
                  Expand
                </>
              )}
            </div>
          </div>
        </div>
        <ProgressBar progress={overallProgress} isFull />
        <p className="mt-2 text-sm text-gray-600">
          {completedCount} of {totalProblems} problems completed (
          {Math.round(overallProgress)}%)
        </p>
      </div>
      <ProblemGroup
        completedProblems={completedProblems}
        setCompletedProblems={setCompletedProblems}
        expandedPatterns={expandedPatterns}
        setExpandedPatterns={setExpandedPatterns}
        groupedProblems={groupedProblems}
      />
    </div>
  );
};

export default ProblemList;
