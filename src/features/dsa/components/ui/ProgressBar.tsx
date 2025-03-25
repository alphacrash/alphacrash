interface ProgressBarProps {
  progress?: number;
  isFull?: boolean;
}

const ProgressBar = ({ progress = 0, isFull = false }: ProgressBarProps) => {
  const containerClass = isFull ? "w-full" : "w-1/5 md:w-5/12";
  const progressBarStyle = { width: `${progress}%` };

  return (
    <div className={`${containerClass} bg-gray-200 rounded-full h-2.5`}>
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
        style={progressBarStyle}
      />
    </div>
  );
};

export default ProgressBar;
