import { useAcademicContext } from '@/state/academic-context.state';

/**
 * Hook to access academic context (year and semester)
 */
export const useAcademicContextHook = () => {
  const year = useAcademicContext((state) => state.year);
  const semester = useAcademicContext((state) => state.semester);
  const setYear = useAcademicContext((state) => state.setYear);
  const setSemester = useAcademicContext((state) => state.setSemester);
  const setAcademicContext = useAcademicContext(
    (state) => state.setAcademicContext
  );

  return {
    year,
    semester,
    setYear,
    setSemester,
    setAcademicContext,
  };
};
