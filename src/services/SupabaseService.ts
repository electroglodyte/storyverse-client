import { supabase } from './supabase';
import type { Database } from '@/types/database';
import { Tables } from '@/types/supabase';

export interface ImportResponse<T> {
  success: boolean;
  message: string;
  data?: T[];
  error?: any;
}

export interface ImportEntityRequest<T> {
  data: T[];
  options?: {
    checkDuplicates?: boolean;
    mergeStrategy?: 'skip' | 'update' | 'replace';
  };
}

export class SupabaseService {
  static async importCharacters(request: ImportEntityRequest<Tables['characters']['Row']>): Promise<ImportResponse<Tables['characters']['Row']>> {
    try {
      const { data, error } = await supabase
        .from('characters')
        .insert(request.data)
        .select();

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: `Successfully imported ${data.length} characters`,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to import characters: ${error.message}`,
        error
      };
    }
  }

  // Add other import methods similarly...
}

export default new SupabaseService();