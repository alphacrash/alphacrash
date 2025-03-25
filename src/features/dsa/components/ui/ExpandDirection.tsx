import { ChevronDown, ChevronRight } from "lucide-react";

interface ExpandDirectionProps {
  isExpanded: boolean;
}

const ExpandDirection = ({ isExpanded }: ExpandDirectionProps) =>
  isExpanded ? (
    <ChevronDown className="w-5 h-5 text-gray-500" />
  ) : (
    <ChevronRight className="w-5 h-5 text-gray-500" />
  );

export default ExpandDirection;
