import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { transformResponse } from '@/lib/supabase'
import { Input, Select, Textarea, Button } from '@/components/ui/form'
import type { Character, StoryWorld } from '@/types/database'

interface Props {
  characterId: string
  onSave?: (character: Character) => void
  onCancel?: () => void
}

export function CharacterDetails({ characterId, onSave, onCancel }: Props) {
  const [character, setCharacter] = useState<Partial<Character>>({})
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load storyworlds
        const { data: worldsData } = await supabase
          .from('story_worlds')
          .select('*')
          .order('name')

        if (worldsData) {
          setStoryWorlds(worldsData.map(world => transformResponse.transformObject(world)))
        }

        // Load character if editing
        if (characterId) {
          const { data: characterData } = await supabase
            .from('characters')
            .select('*')
            .eq('id', characterId)
            .single()

          if (characterData) {
            setCharacter(transformResponse.transformObject(characterData))
          }
        }
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [characterId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (characterId) {
        // Update existing character
        const { data, error } = await supabase
          .from('characters')
          .update(character)
          .eq('id', characterId)
          .select()
          .single()

        if (error) throw error
        if (data && onSave) onSave(data)
      } else {
        // Create new character
        const { data, error } = await supabase
          .from('characters')
          .insert([character])
          .select()
          .single()

        if (error) throw error
        if (data && onSave) onSave(data)
      }
    } catch (err) {
      console.error('Error saving character:', err)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCharacter(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setCharacter(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        name="name"
        value={character.name || ''}
        onChange={handleInputChange}
        required
      />

      <Select
        label="Story World"
        name="story_world_id"
        value={character.story_world_id || ''}
        onChange={handleSelectChange}
      >
        <option value="">Select a story world...</option>
        {storyWorlds.map(world => (
          <option key={world.id} value={world.id}>
            {world.name}
          </option>
        ))}
      </Select>

      <Select
        label="Role"
        name="role"
        value={character.role || ''}
        onChange={handleSelectChange}
      >
        <option value="">Select a role...</option>
        <option value="protagonist">Protagonist</option>
        <option value="antagonist">Antagonist</option>
        <option value="supporting">Supporting</option>
        <option value="background">Background</option>
        <option value="other">Other</option>
      </Select>

      <Textarea
        label="Description"
        name="description"
        value={character.description || ''}
        onChange={handleInputChange}
      />

      <Textarea
        label="Appearance"
        name="appearance"
        value={character.appearance || ''}
        onChange={handleInputChange}
      />

      <Textarea
        label="Background"
        name="background"
        value={character.background || ''}
        onChange={handleInputChange}
      />

      <Input
        label="Age"
        name="age"
        value={character.age || ''}
        onChange={handleInputChange}
      />

      <Textarea
        label="Motivation"
        name="motivation"
        value={character.motivation || ''}
        onChange={handleInputChange}
      />

      <Textarea
        label="Personality"
        name="personality"
        value={character.personality || ''}
        onChange={handleInputChange}
      />

      <Textarea
        label="Notes"
        name="notes"
        value={character.notes || ''}
        onChange={handleInputChange}
      />

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">
          {characterId ? 'Update' : 'Create'} Character
        </Button>
      </div>
    </form>
  )
}
