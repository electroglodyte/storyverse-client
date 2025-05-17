import { Scene, SceneVersion, SceneComment } from '@/types/database'
import { ExtendedScene } from '@/types/extended'
import { supabase } from '@/lib/supabase'
import { DBResponse } from '@/lib/supabase'

export async function getSceneWithDetails(id: string): Promise<ExtendedScene | null> {
  const { data, error } = await supabase
    .from('scenes')
    .select(`
      *,
      story:stories(*),
      comments:scene_comments(*),
      versions:scene_versions(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching scene:', error)
    return null
  }

  return data as ExtendedScene
}

export async function createScene(scene: Partial<Scene>): Promise<DBResponse<Scene>> {
  const { data, error } = await supabase
    .from('scenes')
    .insert([scene])
    .select()
    .single()

  return { data, error }
}

export async function updateScene(id: string, updates: Partial<Scene>): Promise<DBResponse<Scene>> {
  const { data, error } = await supabase
    .from('scenes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteScene(id: string): Promise<DBResponse<Scene>> {
  const { data, error } = await supabase
    .from('scenes')
    .delete()
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function createSceneVersion(version: Partial<SceneVersion>): Promise<DBResponse<SceneVersion>> {
  const { data, error } = await supabase
    .from('scene_versions')
    .insert([version])
    .select()
    .single()

  return { data, error }
}

export async function getSceneVersions(sceneId: string): Promise<SceneVersion[]> {
  const { data, error } = await supabase
    .from('scene_versions')
    .select('*')
    .eq('scene_id', sceneId)
    .order('version_number', { ascending: false })

  if (error) {
    console.error('Error fetching scene versions:', error)
    return []
  }

  return data
}

export async function createSceneComment(comment: Partial<SceneComment>): Promise<DBResponse<SceneComment>> {
  const { data, error } = await supabase
    .from('scene_comments')
    .insert([comment])
    .select()
    .single()

  return { data, error }
}

export async function updateSceneComment(id: string, updates: Partial<SceneComment>): Promise<DBResponse<SceneComment>> {
  const { data, error } = await supabase
    .from('scene_comments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function getSceneComments(sceneId: string): Promise<SceneComment[]> {
  const { data, error } = await supabase
    .from('scene_comments')
    .select('*')
    .eq('scene_id', sceneId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching scene comments:', error)
    return []
  }

  return data
}