import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rkmjjhjjpnhjymqmcvpe.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbWpqaGpqcG5oanltcW1jdnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MzM5NDUsImV4cCI6MjA2MjQwOTk0NX0.GlxA96751aHLq0Bi6nhKXtWHF0tlmWvsemGr3heQ13k'

// Create and export the typed client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

// Export useful types
export type Tables = Database['Tables']
export type TableName = keyof Database['Tables']

// Export typed helpers
export const getTypedTable = <T extends TableName>(table: T) => {
  return supabase.from(table)
}