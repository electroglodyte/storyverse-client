import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { transformResponse } from '@/lib/supabase'
import type { Scene, SceneVersion } from '@/types/database'
import { Button } from '@/components/ui/form'

interface Props {
  sceneId: string
  onSave?: (scene: Scene) => void
  onCancel?: () => void
}

export function SceneEditor({ sceneId, onSave, onCancel }: Props) {
  const [scene, setScene] = useState<Scene | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadScene = async () => {
      try {
        const { data, error } = await supabase
          .from('scenes')
          .select('*')
          .eq('id', sceneId)
          .single()

        if (error) throw error

        if (data) {
          const transformedScene = transformResponse.transformObject(data)
          setScene(transformedScene)
          setContent(transformedScene.content || '')
        }
      } catch (err) {
        console.error('Error loading scene:', err)
      } finally {
        setLoading(false)
      }
    }

    loadScene()
  }, [sceneId])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }

  const createSceneVersion = async () => {
    if (!scene) return

    try {
      // Get the current version count
      const { data: versions } = await supabase
        .from('scene_versions')
        .select('version_number')
        .eq('scene_id', scene.id)
        .order('version_number', { ascending: false })
        .limit(1)

      const nextVersion = versions && versions.length > 0 
        ? (versions[0].version_number || 0) + 1 
        : 1

      // Create new version
      const { error: versionError } = await supabase
        .from('scene_versions')
        .insert({
          scene_id: scene.id,
          content: scene.content,
          version_number: nextVersion
        })

      if (versionError) throw versionError
    } catch (err) {
      console.error('Error creating scene version:', err)
    }
  }

  const handleSave = async () => {
    if (!scene) return

    setSaving(true)
    try {
      // Create version of current content
      await createSceneVersion()

      // Update scene
      const { data, error } = await supabase
        .from('scenes')
        .update({ content })
        .eq('id', scene.id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        const updatedScene = transformResponse.transformObject(data)
        setScene(updatedScene)
        if (onSave) onSave(updatedScene)
      }
    } catch (err) {
      console.error('Error saving scene:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!scene) {
    return <div>Scene not found</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{scene.title}</h2>
        <div className="space-x-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave} loading={saving}>
            Save
          </Button>
        </div>
      </div>

      <textarea
        value={content}
        onChange={handleContentChange}
        className="w-full h-96 p-4 border rounded-md"
        placeholder="Write your scene content here..."
      />
    </div>
  )
}
