import { Tables } from '@/types/database';
import { supabase } from '@/services/supabase';

type WritingSample = Tables['writing_samples']
type StyleProfile = Tables['style_profiles']
type StyleAnalysis = Tables['style_analyses']

export async function getWritingSample(id: string): Promise<WritingSample | null> {
  const { data, error } = await supabase
    .from('writing_samples')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching writing sample:', error)
    return null
  }

  return data
}

export async function createWritingSample(sample: Partial<WritingSample>): Promise<WritingSample | null> {
  const { data, error } = await supabase
    .from('writing_samples')
    .insert(sample)
    .select()
    .single()

  if (error) {
    console.error('Error creating writing sample:', error)
    return null
  }

  return data
}

export async function updateWritingSample(
  id: string,
  updates: Partial<WritingSample>
): Promise<WritingSample | null> {
  const { data, error } = await supabase
    .from('writing_samples')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating writing sample:', error)
    return null
  }

  return data
}

export async function deleteWritingSample(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('writing_samples')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting writing sample:', error)
    return false
  }

  return true
}

export async function getStyleProfile(id: string): Promise<StyleProfile | null> {
  const { data, error } = await supabase
    .from('style_profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching style profile:', error)
    return null
  }

  return data
}

export async function createStyleProfile(profile: Partial<StyleProfile>): Promise<StyleProfile | null> {
  const { data, error } = await supabase
    .from('style_profiles')
    .insert(profile)
    .select()
    .single()

  if (error) {
    console.error('Error creating style profile:', error)
    return null
  }

  return data
}

export async function updateStyleProfile(
  id: string,
  updates: Partial<StyleProfile>
): Promise<StyleProfile | null> {
  const { data, error } = await supabase
    .from('style_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating style profile:', error)
    return null
  }

  return data
}

export async function deleteStyleProfile(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('style_profiles')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting style profile:', error)
    return false
  }

  return true
}

export async function getStyleAnalysis(id: string): Promise<StyleAnalysis | null> {
  const { data, error } = await supabase
    .from('style_analyses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching style analysis:', error)
    return null
  }

  return data
}

export async function createStyleAnalysis(analysis: Partial<StyleAnalysis>): Promise<StyleAnalysis | null> {
  const { data, error } = await supabase
    .from('style_analyses')
    .insert(analysis)
    .select()
    .single()

  if (error) {
    console.error('Error creating style analysis:', error)
    return null
  }

  return data
}

export async function linkSampleToProfile(
  profileId: string,
  sampleId: string,
  weight: number = 1
): Promise<boolean> {
  const { error } = await supabase
    .from('profile_samples')
    .insert({
      profile_id: profileId,
      sample_id: sampleId,
      weight
    })

  if (error) {
    console.error('Error linking sample to profile:', error)
    return false
  }

  return true
}

export async function getProfileSamples(profileId: string) {
  const { data, error } = await supabase
    .from('profile_samples')
    .select(`
      sample_id,
      weight,
      writing_samples (*)
    `)
    .eq('profile_id', profileId)

  if (error) {
    console.error('Error fetching profile samples:', error)
    return []
  }

  return data || []
}

export async function updateSampleWeight(
  profileId: string,
  sampleId: string,
  weight: number
): Promise<boolean> {
  const { error } = await supabase
    .from('profile_samples')
    .update({ weight })
    .eq('profile_id', profileId)
    .eq('sample_id', sampleId)

  if (error) {
    console.error('Error updating sample weight:', error)
    return false
  }

  return true
}

export async function removeSampleFromProfile(
  profileId: string,
  sampleId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('profile_samples')
    .delete()
    .eq('profile_id', profileId)
    .eq('sample_id', sampleId)

  if (error) {
    console.error('Error removing sample from profile:', error)
    return false
  }

  return true
}