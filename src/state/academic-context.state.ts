import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AcademicContextStore {
  year: string;
  semester: string;
  setYear: (year: string) => void;
  setSemester: (semester: string) => void;
  setAcademicContext: (year: string, semester: string) => void;
}

/**
 * Academic context store for tracking selected year and semester
 * Persists to localStorage to survive page reloads
 */
export const useAcademicContext = create<AcademicContextStore>()(
  persist(
    (set) => ({
      year: '2025',
      semester: '1',
      setYear: (year: string) => set({ year }),
      setSemester: (semester: string) => set({ semester }),
      setAcademicContext: (year: string, semester: string) =>
        set({ year, semester }),
    }),
    {
      name: 'ntu-mods-academic-context',
    }
  )
);
