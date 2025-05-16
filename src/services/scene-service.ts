import { Tables } from '@/types/database';
import { supabase } from '@/services/supabase';

type Scene = Tables['scenes']
type SceneVersion = Tables['scene_versions']
type SceneComment = Tables['scene_comments']

export async function getScene(sceneId: string): Promise<Scene | null> {
  const { data, error } = await supabase
    .from('scenes')
    .select('*')
    .eq('id', sceneId)
    .single()

  if (error) {
    console.error('Error fetching scene:', error)
    return null
  }

  return data
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

  return data || []
}

export async function createSceneVersion(scene: Scene, notes?: string): Promise<SceneVersion | null> {
  const { data: existingVersions } = await supabase
    .from('scene_versions')
    .select('version_number')
    .eq('scene_id', scene.id)
    .order('version_number', { ascending: false })
    .limit(1)

  const nextVersionNumber = existingVersions && existingVersions[0] 
    ? existingVersions[0].version_number + 1 
    : 1

  const { data, error } = await supabase
    .from('scene_versions')
    .insert({
      scene_id: scene.id,
      content: scene.content || '',
      version_number: nextVersionNumber,
      notes: notes
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating scene version:', error)
    return null
  }

  return data
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

  return data || []
}

export async function createSceneComment(
  sceneId: string,
  content: string,
  position?: Record<string, any>
): Promise<SceneComment | null> {
  const { data, error } = await supabase
    .from('scene_comments')
    .insert({
      scene_id: sceneId,
      content,
      position
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating scene comment:', error)
    return null
  }

  return data
}

export async function updateSceneComment(
  commentId: string,
  updates: Partial<SceneComment>
): Promise<SceneComment | null> {
  const { data, error } = await supabase
    .from('scene_comments')
    .update(updates)
    .eq('id', commentId)
    .select()
    .single()

  if (error) {
    console.error('Error updating scene comment:', error)
    return null
  }

  return data
}

export async function deleteSceneComment(commentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('scene_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting scene comment:', error)
    return false
  }

  return true
}