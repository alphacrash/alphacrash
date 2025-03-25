import { BookOpen, CheckCircle2, Terminal, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { STORAGE_KEY } from "../constants";
import exercises from "../data/exercises";
import ButtonRow from "./ButtonRow";
import MobileView from "./common/MobileView";
import QueryResults from "./QueryResults";
import SchemaPopup from "./SchemaPopup";
import Sidebar from "./Sidebar";
import { useSelector } from "react-redux";

const Runner = () => {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>(
    () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
  );
  const [expandedLessons, setExpandedLessons] = useState<
    Record<number, boolean>
  >({});
  const [isMobile, setIsMobile] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [activeTableTab, setActiveTableTab] = useState<string | null>(null);

  const db = useSelector((state: { app: { db: any } }) => state.app.db);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTasks));
  }, [completedTasks]);

  useEffect(() => {
    if (showSchema && selectedExercise?.tables.length > 0) {
      setActiveTableTab(selectedExercise.tables[0].name);
    }
  }, [showSchema, selectedExercise]);

  const findLatestUnfinishedTask = () => {
    for (const exercise of exercises) {
      for (let i = 0; i < exercise.tasks.length; i++) {
        if (!completedTasks[exercise.tasks[i].id]) {
          return { exercise, taskIndex: i };
        }
      }
    }
    return null;
  };

  const goToLatestUnfinishedTask = () => {
    const result = findLatestUnfinishedTask();
    if (result) {
      setSelectedExercise(result.exercise);
      setCurrentTaskIndex(result.taskIndex);
      setShowDescription(false);
      setExpandedLessons((prev) => ({
        ...prev,
        [result.exercise.lesson_no]: true,
      }));
    }
  };

  const toggleLesson = (lessonNo: number) => {
    setExpandedLessons((prev) => ({
      ...prev,
      [lessonNo]: !prev[lessonNo],
    }));
  };

  const checkSolution = () => {
    const currentTask = selectedExercise.tasks[currentTaskIndex];

    try {
      const userResult = db.exec(sqlQuery);
      const solutionResult = db.exec(currentTask.solution);

      const isMatch =
        JSON.stringify(userResult) === JSON.stringify(solutionResult);
      setIsCorrect(isMatch);

      if (isMatch) {
        setCompletedTasks((prev) => ({
          ...prev,
          [currentTask.id]: true,
        }));
      }

      userResult?.length > 0 && setQueryResult(userResult[0]);
    } catch (error) {
      setIsCorrect(false);
      setQueryResult(null);
    }
  };

  const handleNextTask = () => {
    if (currentTaskIndex < selectedExercise.tasks.length - 1) {
      setCurrentTaskIndex((prev) => prev + 1);
      setSqlQuery("");
      setIsCorrect(null);
      setQueryResult(null);
    }
  };

  const handleTaskClick = (index: number) => {
    setCurrentTaskIndex(index);
    setSqlQuery("");
    setIsCorrect(null);
    setQueryResult(null);
    setShowDescription(false);
  };

  const handleShowSolution = () => {
    const currentTask = selectedExercise.tasks[currentTaskIndex];
    setSqlQuery(currentTask.solution);
  };

  if (isMobile) {
    return <MobileView />;
  }

  const hasUnfinishedTasks = findLatestUnfinishedTask() !== null;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar
        selectedExercise={selectedExercise}
        setSelectedExercise={(exercise) => {
          setSelectedExercise(exercise);
          setShowDescription(true);
        }}
        toggleLesson={toggleLesson}
        setShowDescription={setShowDescription}
        expandedLessons={expandedLessons}
        currentTaskIndex={currentTaskIndex}
        showDescription={showDescription}
        handleTaskClick={handleTaskClick}
        completedTasks={completedTasks}
      />

      <div className="flex-1 p-8">
        {!selectedExercise ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Terminal className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold">Welcome to SQL Exercises</h2>
            </div>
            <p className="text-gray-700 mb-6">
              Click on any lesson in the sidebar to get started with your SQL
              learning journey.
            </p>
            {hasUnfinishedTasks && (
              <button
                onClick={goToLatestUnfinishedTask}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start or continue your journey
              </button>
            )}
          </div>
        ) : showDescription ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="text-blue-600" size={24} />
              <h2 className="text-2xl font-bold">
                Lesson {selectedExercise.lesson_no}: {selectedExercise.name}
              </h2>
            </div>
            <div className="prose prose-blue max-w-none">
              {selectedExercise.description
                .split("\n")
                .map((paragraph, index) => (
                  <p key={index} className="text-gray-700 whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
            </div>
          </div>
        ) : (
          selectedExercise.tasks.length > 0 && (
            <>
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold mb-2">
                  Task {currentTaskIndex + 1} of {selectedExercise.tasks.length}
                </h3>
                <p className="text-gray-700">
                  {selectedExercise.tasks[currentTaskIndex].text}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <label htmlFor="query" className="text-lg font-semibold">
                    SQL Query
                  </label>
                  {isCorrect !== null && (
                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="text-green-500" />
                      ) : (
                        <XCircle className="text-red-500" />
                      )}
                      <span
                        className={
                          isCorrect ? "text-green-500" : "text-red-500"
                        }
                      >
                        {isCorrect ? "Correct!" : "Try again"}
                      </span>
                    </div>
                  )}
                </div>
                <textarea
                  id="query"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  className="w-full p-4 my-2 border rounded-lg font-mono text-sm bg-gray-50"
                  rows={4}
                  placeholder="Enter your SQL query here..."
                />
                <ButtonRow
                  checkSolution={checkSolution}
                  setShowSchema={setShowSchema}
                  handleShowSolution={handleShowSolution}
                  isCompleted={
                    completedTasks[selectedExercise.tasks[currentTaskIndex].id]
                  }
                  handleNextTask={handleNextTask}
                />
              </div>

              {queryResult && <QueryResults queryResult={queryResult} />}
            </>
          )
        )}
      </div>

      {showSchema && selectedExercise && (
        <SchemaPopup
          setShowSchema={setShowSchema}
          selectedExercise={selectedExercise}
          setActiveTableTab={setActiveTableTab}
          activeTableTab={activeTableTab}
        />
      )}
    </div>
  );
};

export default Runner;
