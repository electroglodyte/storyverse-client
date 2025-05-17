import { StyleProfile, StyleAnalysis, WritingSample } from '@/types/database'
import { StyleProfileWithSamples, WritingSampleWithAnalysis } from '@/types/extended'
import { supabase } from '@/lib/supabase'
import { DBResponse } from '@/lib/supabase'

export async function getStyleProfileWithSamples(id: string): Promise<StyleProfileWithSamples | null> {
  const { data, error } = await supabase
    .from('style_profiles')
    .select(`
      *,
      samples:writing_samples(*),
      analyses:style_analyses(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching style profile:', error)
    return null
  }

  return data as StyleProfileWithSamples
}

export async function createStyleProfile(profile: Partial<StyleProfile>): Promise<DBResponse<StyleProfile>> {
  const { data, error } = await supabase
    .from('style_profiles')
    .insert([profile])
    .select()
    .single()

  return { data, error }
}

export async function updateStyleProfile(id: string, updates: Partial<StyleProfile>): Promise<DBResponse<StyleProfile>> {
  const { data, error } = await supabase
    .from('style_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteStyleProfile(id: string): Promise<DBResponse<StyleProfile>> {
  const { data, error } = await supabase
    .from('style_profiles')
    .delete()
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function createStyleAnalysis(analysis: Partial<StyleAnalysis>): Promise<DBResponse<StyleAnalysis>> {
  const { data, error } = await supabase
    .from('style_analyses')
    .insert([analysis])
    .select()
    .single()

  return { data, error }
}

export async function getWritingSample(id: string): Promise<WritingSampleWithAnalysis | null> {
  const { data, error } = await supabase
    .from('writing_samples')
    .select(`
      *,
      style_analysis:style_analyses(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching writing sample:', error)
    return null
  }

  return data as WritingSampleWithAnalysis
}

export async function createWritingSample(sample: Partial<WritingSample>): Promise<DBResponse<WritingSample>> {
  const { data, error } = await supabase
    .from('writing_samples')
    .insert([sample])
    .select()
    .single()

  return { data, error }
}

export async function updateWritingSample(id: string, updates: Partial<WritingSample>): Promise<DBResponse<WritingSample>> {
  const { data, error } = await supabase
    .from('writing_samples')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteWritingSample(id: string): Promise<DBResponse<WritingSample>> {
  const { data, error } = await supabase
    .from('writing_samples')
    .delete()
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function getStyleAnalysisByWritingSample(sampleId: string): Promise<StyleAnalysis | null> {
  const { data, error } = await supabase
    .from('style_analyses')
    .select('*')
    .eq('sample_id', sampleId)
    .single()

  if (error) {
    console.error('Error fetching style analysis:', error)
    return null
  }

  return data
}