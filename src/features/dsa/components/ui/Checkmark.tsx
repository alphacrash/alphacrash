import { CircleCheckBig } from "lucide-react";
import { CheckmarkProps } from "../../types";

const Checkmark = ({ isChecked, onClick }: CheckmarkProps) => {
  return (
    <div className="cursor-pointer" onClick={onClick}>
      {isChecked ? (
        <CircleCheckBig strokeWidth={2.2} className="text-green-700" />
      ) : (
        <CircleCheckBig
          strokeWidth={2.2}
          className="text-gray-400 transition-all hover:text-green-700"
        />
      )}
    </div>
  );
};

export default Checkmark;