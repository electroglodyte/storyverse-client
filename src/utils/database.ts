import { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

export type DatabaseResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

export type AsyncDatabaseResult<T> = Promise<DatabaseResult<T>>;

export class DatabaseError extends Error {
  constructor(public originalError: PostgrestError) {
    super(originalError.message);
    this.name = 'DatabaseError';
  }
}

export const handleDatabaseError = (error: PostgrestError): never => {
  console.error('Database error:', error);
  toast.error(error.message || 'An unexpected database error occurred');
  throw new DatabaseError(error);
};

export const handleDatabaseOperation = async <T,>(
  operation: () => AsyncDatabaseResult<T>,
  successMessage?: string
): Promise<T> => {
  try {
    const { data, error } = await operation();
    
    if (error) {
      return handleDatabaseError(error);
    }
    
    if (successMessage) {
      toast.success(successMessage);
    }
    
    return data as T;
  } catch (error) {
    console.error('Operation error:', error);
    toast.error('An unexpected error occurred');
    throw error;
  }
};

export const validateRequired = <T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): boolean => {
  for (const field of fields) {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      toast.error(`${String(field)} is required`);
      return false;
    }
  }
  return true;
};