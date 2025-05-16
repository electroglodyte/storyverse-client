// Database type definitions
import type { Database } from '@/lib/database.types'

export type Tables = Database['tables'] 
export type Enums = Database['enums']

// Re-export types from supabase-tables.ts
export * from '@/supabase-tables'
