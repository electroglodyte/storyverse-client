// Supabase client configuration and helpers
import { createClient } from '@supabase/supabase-js'
import type { Tables } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Type-safe Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for consistent transformations on database responses
export const transformResponse = {
  fromNull: <T>(value: T | null): T | undefined => value === null ? undefined : value,
  
  toNull: <T>(value: T | undefined): T | null => value === undefined ? null : value,

  transformObject: <T extends Record<string, any>>(obj: T): T => {
    const transformed: any = {}
    for (const [key, value] of Object.entries(obj)) {
      transformed[key] = value === null ? undefined : value
    }
    return transformed
  }
}

// Base table helper that transforms nulls to undefined
export const getTable = <T extends keyof Tables>(tableName: T) => {
  return supabase.from(tableName).select('*').then(({ data, error }) => {
    if (error) throw error
    return data?.map(row => transformResponse.transformObject(row))
  }) 
}

// Export types for use in components
export type SupabaseClient = typeof supabase
export type TablesInsert<T extends keyof Tables> = Tables[T]['Insert']
export type TablesUpdate<T extends keyof Tables> = Tables[T]['Update']
export type TablesRow<T extends keyof Tables> = Tables[T]['Row']
