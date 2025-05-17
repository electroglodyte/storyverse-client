import { useState, useEffect, useCallback } from 'react';
import { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | PostgrestError | null;
}

interface UseFetchOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error | PostgrestError) => void;
  dependencies?: any[];
}

export function useFetch<T>(
  fetchFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options: UseFetchOptions = {}
): FetchState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await fetchFn();

      if (error) {
        setState({ data: null, loading: false, error });
        options.onError?.(error);
        toast.error(error.message || 'An error occurred while fetching data');
        return;
      }

      setState({ data, loading: false, error: null });
      options.onSuccess?.(data);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('An unknown error occurred');
      setState({ data: null, loading: false, error: err });
      options.onError?.(err);
      toast.error(err.message);
    }
  }, [fetchFn, options.onSuccess, options.onError]);

  useEffect(() => {
    fetchData();
  }, options.dependencies || [fetchFn]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return { ...state, refetch };
}

interface MutationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | PostgrestError | null;
}

interface UseMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error | PostgrestError) => void;
  onSettled?: () => void;
}

export function useMutation<T, V = any>(
  mutationFn: (variables: V) => Promise<{ data: T | null; error: PostgrestError | null }>,
  options: UseMutationOptions<T> = {}
): [
  (variables: V) => Promise<T | null>,
  MutationState<T>
] {
  const [state, setState] = useState<MutationState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = async (variables: V): Promise<T | null> => {
    setState({ data: null, loading: true, error: null });

    try {
      const { data, error } = await mutationFn(variables);

      if (error) {
        setState({ data: null, loading: false, error });
        options.onError?.(error);
        toast.error(error.message || 'An error occurred');
        return null;
      }

      setState({ data, loading: false, error: null });
      options.onSuccess?.(data as T);
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('An unknown error occurred');
      setState({ data: null, loading: false, error: err });
      options.onError?.(err);
      toast.error(err.message);
      return null;
    } finally {
      options.onSettled?.();
    }
  };

  return [mutate, state];
}