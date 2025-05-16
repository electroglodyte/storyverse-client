import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Character, StoryWorld, Story } from '../../supabase-tables';
import { Select, Input, Textarea, Button } from '@/components/ui/form-elements';

interface CharacterDetailsProps {
  characterId?: string;
}

export const CharacterDetails: React.FC<CharacterDetailsProps> = ({ characterId }) => {
  const supabase = useSupabaseClient();
  const [character, setCharacter] = useState<Character | null>(null);
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryWorld, setSelectedStoryWorld] = useState<string>('');
  const [selectedStory, setSelectedStory] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchStoryWorlds();
    if (characterId) {
      fetchCharacter(characterId);
    }
  }, [characterId]);

  // Fetch stories when storyworld changes
  useEffect(() => {
    if (selectedStoryWorld) {
      fetchStories(selectedStoryWorld);
    }
  }, [selectedStoryWorld]);

  const fetchStoryWorlds = async () => {
    const { data, error } = await supabase
      .from('story_worlds')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching story worlds:', error);
      return;
    }
    
    setStoryWorlds(data);
  };

  const fetchStories = async (storyWorldId: string) => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('story_world_id', storyWorldId)
      .order('title');
    
    if (error) {
      console.error('Error fetching stories:', error);
      return;
    }
    
    setStories(data);
  };

  const fetchCharacter = async (id: string) => {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching character:', error);
      return;
    }
    
    setCharacter(data);
    setSelectedStoryWorld(data.story_world_id || '');
    setSelectedStory(data.story_id || '');
  };

  const handleSave = async () => {
    if (!character) return;

    const { error } = await supabase
      .from('characters')
      .update({
        ...character,
        updated_at: new Date().toISOString()
      })
      .eq('id', character.id);

    if (error) {
      console.error('Error saving character:', error);
      return;
    }

    setIsEditing(false);
    setLastCheckTime(new Date().toISOString());
  };

  const handleInputChange = (field: keyof Character, value: any) => {
    if (!character) return;
    
    setCharacter({
      ...character,
      [field]: value
    });
  };

  if (!character) return <div>Select a character to view details</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between mb-6">
        <div className="space-x-4 flex">
          <Select
            value={selectedStoryWorld}
            onChange={(e) => setSelectedStoryWorld(e.target.value)}
            className="w-48"
          >
            <option value="">Select Story World</option>
            {storyWorlds.map(world => (
              <option key={world.id} value={world.id}>{world.name}</option>
            ))}
          </Select>

          <Select
            value={selectedStory}
            onChange={(e) => setSelectedStory(e.target.value)}
            className="w-48"
            disabled={!selectedStoryWorld}
          >
            <option value="">Select Story</option>
            {stories.map(story => (
              <option key={story.id} value={story.id}>{story.title}</option>
            ))}
          </Select>
        </div>

        <div className="space-x-4">
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit</Button>
          )}
          {isEditing && (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={character.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <Select
              value={character.role || ''}
              onChange={(e) => handleInputChange('role', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select Role</option>
              <option value="protagonist">Protagonist</option>
              <option value="antagonist">Antagonist</option>
              <option value="supporting">Supporting</option>
              <option value="background">Background</option>
              <option value="other">Other</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <Input
              value={character.age || ''}
              onChange={(e) => handleInputChange('age', e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={character.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Background</label>
            <Textarea
              value={character.background || ''}
              onChange={(e) => handleInputChange('background', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Motivation</label>
            <Textarea
              value={character.motivation || ''}
              onChange={(e) => handleInputChange('motivation', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Personality</label>
            <Textarea
              value={character.personality || ''}
              onChange={(e) => handleInputChange('personality', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Appearance</label>
            <Textarea
              value={character.appearance || ''}
              onChange={(e) => handleInputChange('appearance', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Textarea
              value={character.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>
        </div>
      </div>

      {lastCheckTime && (
        <div className="mt-6 text-sm text-gray-500">
          Last checked: {new Date(lastCheckTime).toLocaleString()}
        </div>
      )}
    </div>
  );
};