import { ProblemGroupProps } from "../../types";
import ExpandDirection from "../common/ExpandDirection";
import ProblemRow from "./ProblemRow";
import ProgressBar from "./ProgressBar";

const ProblemGroup = ({
  completedProblems,
  setCompletedProblems,
  expandedPatterns,
  setExpandedPatterns,
  groupedProblems,
}: ProblemGroupProps) => {
  const togglePattern = (pattern) => {
    setExpandedPatterns((prev) => {
      const next = new Set(prev);
      if (next.has(pattern)) {
        next.delete(pattern);
      } else {
        next.add(pattern);
      }
      return next;
    });
  };

  return Object.entries(groupedProblems).map(([pattern, patternProblems]) => {
    const patternCompletedCount = patternProblems.filter((p) =>
      completedProblems.has(p.code)
    ).length;
    const patternProgress =
      (patternCompletedCount / patternProblems.length) * 100;
    const isExpanded = expandedPatterns.has(pattern);

    return (
      <div key={pattern} className="px-4 pt-3 border-solid border-gray-200 rounded-md">
        <div
          className="flex items-baseline cursor-pointer gap-2"
          onClick={() => togglePattern(pattern)}
        >
          <ExpandDirection isExpanded={isExpanded} />
          <h2 className="text-xl font-bold text-gray-900 flex-1">{pattern}</h2>
          <div className="text-sm text-gray-600">
            {patternCompletedCount} / {patternProblems.length}
          </div>
          <ProgressBar progress={patternProgress} isFull={false} />
        </div>

        {isExpanded && (
          <div className="flex flex-col ml-4 my-2 overflow-hidden">
            {patternProblems.map((problem) => (
              <ProblemRow
                key={problem.code}
                completedProblems={completedProblems}
                setCompletedProblems={setCompletedProblems}
                problem={problem}
              />
            ))}
          </div>
        )}
      </div>
    );
  });
};

export default ProblemGroup;
