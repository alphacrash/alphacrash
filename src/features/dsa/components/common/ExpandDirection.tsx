import { ChevronDown, ChevronRight } from "lucide-react";
import { ExpandDirectionProps } from "../../types";

const ExpandDirection = ({ isExpanded }: ExpandDirectionProps) => {
  return isExpanded ? (
    <ChevronDown className="w-5 h-5 text-gray-500" />
  ) : (
    <ChevronRight className="w-5 h-5 text-gray-500" />
  );
};

export default ExpandDirection;