import { useEffect, useState } from 'react';
import { useLatestSemester } from './use-latest-semester';
import { useDebounce } from './use-debounce';

interface Module {
  code: string;
  title: string;
  au: string;
  searchKeys?: string[];
  notAvailableToProgramme?: string;
}

interface SearchResponse {
  results: Module[];
  total: number;
}

/**
 * Hook for searching modules with debounce
 * Automatically uses the current year/semester from academic context
 * Debounces search queries to avoid excessive API calls
 */
export const useModuleSearchApi = (query: string = '', debounceMs: number = 300) => {
  const { year, semester } = useLatestSemester();
  const debouncedQuery = useDebounce(query, debounceMs);

  const [results, setResults] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    const searchModules = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          year,
          semester,
          q: debouncedQuery,
        });

        const response = await fetch(`/api/data/modules/search?${params}`);

        if (!response.ok) {
          throw new Error(`Failed to search modules: ${response.status}`);
        }

        const data = (await response.json()) as SearchResponse;
        setResults(data.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchModules();
  }, [debouncedQuery, year, semester]);

  return {
    results,
    isLoading,
    error,
  };
};
