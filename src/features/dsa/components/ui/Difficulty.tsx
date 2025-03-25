import { getDifficultyClass } from "@site/src/utils";

interface DifficultyProps {
  difficulty: string;
}

const Difficulty = ({ difficulty }: DifficultyProps) => (
  <div className={getDifficultyClass(difficulty)}>{difficulty}</div>
);

export default Difficulty;
