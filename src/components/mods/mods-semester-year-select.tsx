'use client';

import { useEffect, useState } from 'react';
import { useAcademicContextHook } from '@/hooks/use-academic-context';
import CustomSelect from '@/components/select';
import { cn } from '@/lib/utils';

interface Semester {
  code: string;
  name: string;
}

/**
 * Year and semester selector component
 * Fetches available semesters from API and allows user to switch between them
 */
export const ModsSemesterYearSelect = () => {
  const { year, semester, setAcademicContext } = useAcademicContextHook();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch available semesters on mount
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/data/semesters');
        if (!response.ok) {
          throw new Error('Failed to fetch semesters');
        }
        const data = await response.json();
        setSemesters(data.semesters);

        // Extract unique years
        const uniqueYears = Array.from(
          new Set(data.semesters.map((s: Semester) => s.code.split(';')[0]))
        ) as string[];
        uniqueYears.sort((a, b) => parseInt(b) - parseInt(a));
        setYears(uniqueYears);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSemesters();
  }, []);

  // Get semesters for current year
  const currentYearSemesters = semesters
    .filter((s) => s.code.startsWith(`${year};`))
    .map((s) => ({
      value: s.code.split(';')[1],
      label: s.name,
    }));

  const yearOptions = years.map((y) => ({
    value: y,
    label: `${y}`,
  }));

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">Error: {error}</div>;
  }

  return (
    <div className="flex gap-1">
      <CustomSelect
        closeOnSelect
        value={year}
        selectItems={yearOptions}
        onChange={(value) => {
          // When year changes, try to keep semester if available
          const newYear = value as string;
          const availableSemesters = semesters.filter((s) =>
            s.code.startsWith(`${newYear};`)
          );
          const newSemester = availableSemesters.some((s) =>
            s.code.endsWith(`;${semester}`)
          )
            ? semester
            : availableSemesters[0]?.code.split(';')[1] || '1';

          setAcademicContext(newYear, newSemester);
        }}
        divClassName={cn('w-20 lg:w-auto', 'ring-1 ring-ring rounded-md')}
      />

      <CustomSelect
        closeOnSelect
        value={semester}
        selectItems={currentYearSemesters}
        onChange={(value) => setAcademicContext(year, value as string)}
        divClassName={cn('w-24 lg:w-auto', 'ring-1 ring-ring rounded-md')}
      />
    </div>
  );
};
