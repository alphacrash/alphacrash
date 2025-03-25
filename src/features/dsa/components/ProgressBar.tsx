import { ProgressBarProps } from "../types";

const ProgressBar = ({ progress, isFull }: ProgressBarProps) => (
  <div
    className={`${
      isFull ? "w-full" : "w-1/5 md:w-5/12"
    } bg-gray-200 rounded-full h-2.5`}
  >
    <div
      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
      style={{ width: `${progress}%` }}
    />
  </div>
);

export default ProgressBar;
