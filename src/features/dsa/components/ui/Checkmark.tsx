import { CircleCheckBig } from "lucide-react";

interface CheckmarkProps {
  isChecked: boolean;
  onClick: React.MouseEventHandler<HTMLDivElement>;
}

const Checkmark = ({ isChecked, onClick }: CheckmarkProps) => (
  <div className="cursor-pointer" onClick={onClick}>
    <CircleCheckBig
      strokeWidth={2.2}
      className={
        isChecked
          ? "text-green-700"
          : "text-gray-400 transition-all hover:text-green-700"
      }
    />
  </div>
);

export default Checkmark;
