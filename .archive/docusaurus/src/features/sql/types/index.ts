export interface Task {
  id: number;
  text: string;
  solution: string;
}

export interface Exercise {
  lesson_no: number;
  name: string;
  description: string;
  tasks: Task[];
}

export interface CompletedTasks {
  [key: number]: boolean;
}

export interface SidebarProps {
  selectedExercise: {
    lesson_no: number;
    name: string;
    description: string;
    tasks: { id: number; text: string; solution: string }[];
    tables: (
      | {
          name: string;
          schema: string[][];
          sampleData: {
            id: number;
            title: string;
            year: number;
            director: string;
            rating: number;
          }[];
        }
      | {
          name: string;
          schema: string[][];
          sampleData: {
            id: number;
            name: string;
            birth_year: number;
            nationality: string;
          }[];
        }
    )[];
  };
  setSelectedExercise;
  toggleLesson: (lessonNo: number) => void;
  setShowDescription;
  expandedLessons: Record<number, boolean>;
  currentTaskIndex: number;
  showDescription: boolean;
  handleTaskClick: (index: number) => void;
  completedTasks: Record<number, boolean>;
}

export interface SchemaPopupProps {
  setShowSchema;
  selectedExercise: {
    lesson_no: number;
    name: string;
    description: string;
    tasks: { id: number; text: string; solution: string }[];
    tables: (
      | {
          name: string;
          schema: string[][];
          sampleData: {
            id: number;
            title: string;
            year: number;
            director: string;
            rating: number;
          }[];
        }
      | {
          name: string;
          schema: string[][];
          sampleData: {
            id: number;
            name: string;
            birth_year: number;
            nationality: string;
          }[];
        }
    )[];
  };
  setActiveTableTab;
  activeTableTab: string;
}

export interface ButtonRowProps {
  checkSolution: () => void;
  setShowSchema;
  handleShowSolution: () => void;
  isCompleted: boolean;
  handleNextTask: () => void;
}
