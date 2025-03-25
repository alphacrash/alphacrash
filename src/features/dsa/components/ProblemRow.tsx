import Link from "@docusaurus/Link";
import { useEffect, useState } from "react";
import { ProblemRowProps } from "../types/props";
import { Checkmark, Difficulty } from "./ui";

const ProblemRow = ({ completedProblems, setCompletedProblems, problem }: ProblemRowProps) => {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(completedProblems.has(problem.code));
  }, [completedProblems, problem.code]);

  const toggleCompletion = () => {
    setCompletedProblems(prev => {
      const next = new Set(prev);
      next.has(problem.code) ? next.delete(problem.code) : next.add(problem.code);
      return next;
    });
  };

  return (
    <div className={`flex items-center mb-2 px-4 py-2 transition-all rounded-2xl ${completed && "bg-green-100"}`}>
      <div className="flex items-center gap-6">
        <Checkmark isChecked={completed} onClick={toggleCompletion} />
        <div className="flex flex-col">
          <Link
            href={`https://leetcode.com/problems/${problem.link}`}
            className="text-lg font-medium text-blue-500 hover:text-blue-700 hover:underline"
          >
            {problem.problem}
          </Link>
          <div className="text-sm">
            <Difficulty difficulty={problem.difficulty} />
          </div>
        </div>
      </div>
    </div>
  );
};