import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Terminal,
} from "lucide-react";
import exercises from "../data/exercises";
import { SidebarProps } from "../types";

const Sidebar = ({
  selectedExercise,
  setSelectedExercise,
  toggleLesson,
  setShowDescription,
  expandedLessons,
  currentTaskIndex,
  showDescription,
  handleTaskClick,
  completedTasks,
}: SidebarProps) => {
  return (
    <div className="w-72 bg-white shadow-lg">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Terminal size={24} />
          SQL Exercises
        </h2>
      </div>
      <div className="p-4">
        {exercises.map((exercise) => (
          <div key={exercise.lesson_no}>
            <div
              className={`p-3 rounded-lg cursor-pointer mb-2 flex items-center justify-between ${
                selectedExercise?.lesson_no === exercise.lesson_no
                  ? "bg-blue-50 text-blue-600"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => {
                setSelectedExercise(exercise);
                toggleLesson(exercise.lesson_no);
                setShowDescription(true);
              }}
            >
              <div>
                <h3 className="font-medium">Lesson {exercise.lesson_no}</h3>
                <p className="text-sm text-gray-600">{exercise.name}</p>
              </div>
              {expandedLessons[exercise.lesson_no] ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronRight size={20} />
              )}
            </div>

            {expandedLessons[exercise.lesson_no] &&
              exercise.tasks.length > 0 && (
                <div className="ml-4 space-y-2">
                  {exercise.tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className={`flex items-center p-2 rounded cursor-pointer ${
                        currentTaskIndex === index &&
                        selectedExercise?.lesson_no === exercise.lesson_no &&
                        !showDescription
                          ? "bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleTaskClick(index)}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 ${
                          completedTasks[task.id]
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                      >
                        <CheckCircle2 size={20} />
                      </div>
                      <span className="text-sm truncate">Task {index + 1}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
