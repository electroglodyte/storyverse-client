import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Faction, StoryWorld, Story, Character, Location } from '../../supabase-tables';
import { Select, Input, Textarea, Button } from '@/components/ui/form-elements';

interface FactionDetailsProps {
  factionId?: string;
}

export const FactionDetails: React.FC<FactionDetailsProps> = ({ factionId }) => {
  const supabase = useSupabaseClient();
  const [faction, setFaction] = useState<Faction | null>(null);
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedStoryWorld, setSelectedStoryWorld] = useState<string>('');
  const [selectedStory, setSelectedStory] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchStoryWorlds();
    if (factionId) {
      fetchFaction(factionId);
    }
  }, [factionId]);

  // Fetch stories when storyworld changes
  useEffect(() => {
    if (selectedStoryWorld) {
      fetchStories(selectedStoryWorld);
      fetchCharacters(selectedStoryWorld);
      fetchLocations(selectedStoryWorld);
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

  const fetchCharacters = async (storyWorldId: string) => {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('story_world_id', storyWorldId)
      .order('name');
    
    if (error) {
      console.error('Error fetching characters:', error);
      return;
    }
    
    setCharacters(data);
  };

  const fetchLocations = async (storyWorldId: string) => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('story_world_id', storyWorldId)
      .order('name');
    
    if (error) {
      console.error('Error fetching locations:', error);
      return;
    }
    
    setLocations(data);
  };

  const fetchFaction = async (id: string) => {
    const { data, error } = await supabase
      .from('factions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching faction:', error);
      return;
    }
    
    setFaction(data);
    setSelectedStoryWorld(data.story_world_id || '');
    setSelectedStory(data.story_id || '');
  };

  const handleSave = async () => {
    if (!faction) return;

    const { error } = await supabase
      .from('factions')
      .update({
        ...faction,
        updated_at: new Date().toISOString()
      })
      .eq('id', faction.id);

    if (error) {
      console.error('Error saving faction:', error);
      return;
    }

    setIsEditing(false);
    setLastCheckTime(new Date().toISOString());
  };

  const handleInputChange = (field: keyof Faction, value: any) => {
    if (!faction) return;
    
    setFaction({
      ...faction,
      [field]: value
    });
  };

  if (!faction) return <div>Select a faction to view details</div>;

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
              value={faction.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Faction Type</label>
            <Select
              value={faction.faction_type || ''}
              onChange={(e) => handleInputChange('faction_type', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select Type</option>
              <option value="government">Government</option>
              <option value="organization">Organization</option>
              <option value="family">Family</option>
              <option value="species">Species</option>
              <option value="religion">Religion</option>
              <option value="other">Other</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Leader</label>
            <Select
              value={faction.leader_character_id || ''}
              onChange={(e) => handleInputChange('leader_character_id', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select Leader</option>
              {characters.map(char => (
                <option key={char.id} value={char.id}>{char.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Headquarters</label>
            <Select
              value={faction.headquarters_location_id || ''}
              onChange={(e) => handleInputChange('headquarters_location_id', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select Headquarters</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={faction.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ideology</label>
            <Textarea
              value={faction.ideology || ''}
              onChange={(e) => handleInputChange('ideology', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Goals</label>
            <Textarea
              value={faction.goals || ''}
              onChange={(e) => handleInputChange('goals', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Resources</label>
            <Textarea
              value={faction.resources || ''}
              onChange={(e) => handleInputChange('resources', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Textarea
              value={faction.notes || ''}
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