import { create } from 'zustand';

export interface Routine {
  id: string;
  block: string;
  timeSlot: string;
  intent: string;
  completedDates: { [date: string]: 'done' | 'partial' | 'not-done' }; // Status for each date
  createdAt: string;
}

interface RoutinesState {
  routines: Routine[];
  isLoading: boolean;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  loadRoutines: () => Promise<void>;
  saveRoutines: () => Promise<void>;
  addRoutine: (block: string, timeSlot: string, intent: string) => void;
  updateRoutine: (id: string, block: string, timeSlot: string, intent: string) => void;
  deleteRoutine: (id: string) => void;
  toggleRoutineDay: (routineId: string, date: string) => void;
  setRoutineStatus: (routineId: string, date: string, status: 'done' | 'partial' | 'not-done' | null) => void;
  clearAllRoutines: () => void;
  deduplicateRoutines: () => void;
}

export const useRoutines = create<RoutinesState>()((set, get) => ({
  routines: [],
  isLoading: false,
  accessToken: null,

  setAccessToken: (token: string | null) => {
    set({ accessToken: token });
  },

  loadRoutines: async () => {
    // Load from localStorage only (no backend calls)
    set({ isLoading: true });
    try {
      const saved = localStorage.getItem('tradejournal_routines');
      if (saved) {
        const parsed = JSON.parse(saved);
        set({ routines: parsed });
      }
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  saveRoutines: async () => {
    // Save to localStorage only (no backend calls)
    const { routines } = get();
    try {
      localStorage.setItem('tradejournal_routines', JSON.stringify(routines));
    } catch (error) {
      console.error('Error saving routines:', error);
    }
  },
  
  addRoutine: (block: string, timeSlot: string, intent: string) => {
    set((state) => {
      // Check if routine with same block already exists
      const exists = state.routines.some(
        routine => routine.block.toLowerCase() === block.toLowerCase()
      );
      
      if (exists) {
        return state; // Don't add duplicate
      }
      
      const newRoutine: Routine = {
        id: `routine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        block,
        timeSlot,
        intent,
        completedDates: {},
        createdAt: new Date().toISOString(),
      };
      
      return {
        routines: [...state.routines, newRoutine],
      };
    });
    get().saveRoutines();
  },
  
  updateRoutine: (id: string, block: string, timeSlot: string, intent: string) => {
    set((state) => ({
      routines: state.routines.map(routine => 
        routine.id === id 
          ? { ...routine, block, timeSlot, intent }
          : routine
      ),
    }));
    get().saveRoutines();
  },
  
  deleteRoutine: (id: string) => {
    set((state) => ({
      routines: state.routines.filter(r => r.id !== id),
    }));
    get().saveRoutines();
  },

  toggleRoutineDay: (routineId: string, date: string) => {
    set((state) => ({
      routines: state.routines.map(routine => {
        if (routine.id === routineId) {
          const newCompletedDates = { ...routine.completedDates || {} };
          const currentStatus = newCompletedDates[date];
          
          // Cycle through: not-done → done → partial → (remove/not-done)
          if (!currentStatus || currentStatus === 'not-done') {
            newCompletedDates[date] = 'done';
          } else if (currentStatus === 'done') {
            newCompletedDates[date] = 'partial';
          } else if (currentStatus === 'partial') {
            delete newCompletedDates[date]; // Remove = not-done
          }
          
          return {
            ...routine,
            completedDates: newCompletedDates,
          };
        }
        return routine;
      }),
    }));
    get().saveRoutines();
  },

  setRoutineStatus: (routineId: string, date: string, status: 'done' | 'partial' | 'not-done' | null) => {
    set((state) => ({
      routines: state.routines.map(routine => {
        if (routine.id === routineId) {
          const newCompletedDates = { ...routine.completedDates || {} };
          
          if (status) {
            newCompletedDates[date] = status;
          } else {
            delete newCompletedDates[date]; // Remove = not-done
          }
          
          return {
            ...routine,
            completedDates: newCompletedDates,
          };
        }
        return routine;
      }),
    }));
    get().saveRoutines();
  },

  clearAllRoutines: () => {
    set({ routines: [] });
    get().saveRoutines();
  },

  deduplicateRoutines: () => {
    set((state) => {
      const seen = new Map<string, Routine>();
      const deduped: Routine[] = [];
      let counter = 0;
      
      // Keep the first occurrence of each unique block (case-insensitive)
      state.routines.forEach((routine) => {
        const key = routine.block.toLowerCase();
        if (!seen.has(key)) {
          // Ensure routine has all required properties and a unique ID
          const validRoutine: Routine = {
            ...routine,
            id: `routine-${Date.now()}-${counter++}-${Math.random().toString(36).substr(2, 9)}`,
            completedDates: routine.completedDates || {},
            block: routine.block || '',
            timeSlot: routine.timeSlot || '',
            intent: routine.intent || '',
            createdAt: routine.createdAt || new Date().toISOString(),
          };
          seen.set(key, validRoutine);
          deduped.push(validRoutine);
        }
      });
      
      return { routines: deduped };
    });
    get().saveRoutines();
  },
}));