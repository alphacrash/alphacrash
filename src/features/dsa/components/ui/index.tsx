import { ChevronDown, ChevronRight, CircleCheckBig } from "lucide-react";
import { BaseProps } from "../../types/common";

export const Checkmark = ({ isChecked, onClick }: BaseProps) => (
  <div className="cursor-pointer" onClick={onClick}>
    <CircleCheckBig
      strokeWidth={2.2}
      className={isChecked ? "text-green-700" : "text-gray-400 hover:text-green-700"}
    />
  </div>
);

export const Difficulty = ({ difficulty }: BaseProps) => {
  const colors = {
    Easy: "text-green-600",
    Medium: "text-yellow-500",
    Hard: "text-red-600",
  };
  return <div className={colors[difficulty] || "text-gray-500"}>{difficulty}</div>;
};

export const ExpandDirection = ({ isExpanded }: BaseProps) => (
  isExpanded ? 
    <ChevronDown className="w-5 h-5 text-gray-500" /> : 
    <ChevronRight className="w-5 h-5 text-gray-500" />
);

export const ProgressBar = ({ progress = 0, isFull = false }) => (
  <div className={`${isFull ? "w-full" : "w-1/5 md:w-5/12"} bg-gray-200 rounded-full h-2.5`}>
    <div
      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
      style={{ width: `${progress}%` }}
    />
  </div>
);