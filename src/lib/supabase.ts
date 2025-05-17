import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = 'https://gtnyfxhcrikjrlxprpxp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bnlmeGhjcmlranJseHBycHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDYyMzQsImV4cCI6MjA2MjI4MjIzNH0.aY-qIeOjoLlDnhF36Sm5PWdPazhQAmSiJdbpWbXdgH0'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper type for table names
type TableName = keyof Database['public']['Tables']

// Generic function to get typed table reference
export function getTable<T extends TableName>(tableName: T) {
  return supabase.from(tableName)
}

// Type helper for select queries
export type DBResponse<T> = {
  data: T | null
  error: Error | null
}

// Type helper for joint queries
export type JointResponse<T, U> = {
  data: (T & { [key: string]: U | U[] | null })[] | null
  error: Error | null
}