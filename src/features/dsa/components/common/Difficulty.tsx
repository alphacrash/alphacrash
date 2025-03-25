import { DifficultyProps } from "../../types";

const Difficulty = ({ difficulty }: DifficultyProps) => {
  const difficultyColors = {
    Easy: "text-green-600",
    Medium: "text-yellow-500",
    Hard: "text-red-600",
  };

  return (
    <div className={difficultyColors[difficulty] || "text-gray-500"}>
      {difficulty}
    </div>
  );
};

export default Difficulty;