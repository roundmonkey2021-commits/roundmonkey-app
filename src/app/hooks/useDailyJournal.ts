import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TodoItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface JournalEntry {
  date: string; // YYYY-MM-DD format
  journalText: string;
  todoList: TodoItem[];
}

interface DailyJournalState {
  entries: { [date: string]: JournalEntry };
  getEntry: (date: string) => JournalEntry | undefined;
  saveEntry: (date: string, journalText: string, todoList: TodoItem[]) => void;
  addTodoItem: (date: string, text: string) => void;
  toggleTodoItem: (date: string, todoId: string) => void;
  deleteTodoItem: (date: string, todoId: string) => void;
  updateTodoText: (date: string, todoId: string, text: string) => void;
  getDatesWithEntries: () => string[];
  getDatesWithTodos: () => string[];
}

export const useDailyJournal = create<DailyJournalState>()(
  persist(
    (set, get) => ({
      entries: {},

      getEntry: (date: string) => {
        return get().entries[date];
      },

      saveEntry: (date: string, journalText: string, todoList: TodoItem[]) => {
        set((state) => ({
          entries: {
            ...state.entries,
            [date]: {
              date,
              journalText,
              todoList,
            },
          },
        }));
      },

      addTodoItem: (date: string, text: string) => {
        const entry = get().entries[date];
        const newTodo: TodoItem = {
          id: Date.now().toString(),
          text,
          isCompleted: false,
        };

        set((state) => ({
          entries: {
            ...state.entries,
            [date]: {
              date,
              journalText: entry?.journalText || '',
              todoList: [...(entry?.todoList || []), newTodo],
            },
          },
        }));
      },

      toggleTodoItem: (date: string, todoId: string) => {
        const entry = get().entries[date];
        if (!entry) return;

        const updatedTodos = entry.todoList.map((todo) =>
          todo.id === todoId ? { ...todo, isCompleted: !todo.isCompleted } : todo
        );

        set((state) => ({
          entries: {
            ...state.entries,
            [date]: {
              ...entry,
              todoList: updatedTodos,
            },
          },
        }));
      },

      deleteTodoItem: (date: string, todoId: string) => {
        const entry = get().entries[date];
        if (!entry) return;

        const updatedTodos = entry.todoList.filter((todo) => todo.id !== todoId);

        set((state) => ({
          entries: {
            ...state.entries,
            [date]: {
              ...entry,
              todoList: updatedTodos,
            },
          },
        }));
      },

      updateTodoText: (date: string, todoId: string, text: string) => {
        const entry = get().entries[date];
        if (!entry) return;

        const updatedTodos = entry.todoList.map((todo) =>
          todo.id === todoId ? { ...todo, text } : todo
        );

        set((state) => ({
          entries: {
            ...state.entries,
            [date]: {
              ...entry,
              todoList: updatedTodos,
            },
          },
        }));
      },

      getDatesWithEntries: () => {
        const entries = get().entries;
        return Object.keys(entries).filter((date) => entries[date].journalText.trim() !== '');
      },

      getDatesWithTodos: () => {
        const entries = get().entries;
        return Object.keys(entries).filter((date) => entries[date].todoList.length > 0);
      },
    }),
    {
      name: 'daily-journal-storage',
    }
  )
);
