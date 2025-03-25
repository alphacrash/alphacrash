import { ArrowRight, LightbulbIcon, Table as TableIcon } from "lucide-react";
import { ButtonRowProps } from "../types";

const ButtonRow = ({
  checkSolution,
  setShowSchema,
  handleShowSolution,
  isCompleted,
  handleNextTask,
}: ButtonRowProps) => {
  return (
    <div className="flex gap-4">
      <>
        <div
          onClick={checkSolution}
          className="cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-lg h-fit hover:bg-blue-700 transition-colors"
        >
          Run Query
        </div>
        <div
          onClick={() => setShowSchema(true)}
          className="cursor-pointer px-6 py-2 bg-gray-600 text-white rounded-lg h-fit hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <TableIcon size={20} />
          View Schema
        </div>
        <div
          onClick={handleShowSolution}
          className="cursor-pointer px-6 py-2 bg-yellow-600 text-white rounded-lg h-fit hover:bg-yellow-700 transition-colors flex items-center gap-2"
        >
          <LightbulbIcon size={20} />
          Show Solution
        </div>
      </>
      {isCompleted && (
        <div
          onClick={handleNextTask}
          className="cursor-pointer px-6 py-2 bg-green-600 text-white rounded-lg h-fit hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          Next Task
          <ArrowRight size={20} />
        </div>
      )}
    </div>
  );
};

export default ButtonRow;
