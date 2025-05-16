export class SupabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;

  constructor(error: any) {
    super(error.message || 'An unknown error occurred');
    this.name = 'SupabaseError';
    this.code = error.code;
    this.details = error.details;
    this.hint = error.hint;
  }
}

export function handleError(error: unknown): SupabaseError {
  if (error instanceof SupabaseError) {
    return error;
  }

  if (error instanceof Error) {
    return new SupabaseError({
      message: error.message,
      name: error.name,
    });
  }

  return new SupabaseError({
    message: 'An unknown error occurred',
  });
}

export function isSupabaseError(error: any): error is SupabaseError {
  return error instanceof SupabaseError;
}

export function formatError(error: unknown): string {
  const err = handleError(error);
  return err.message;
}