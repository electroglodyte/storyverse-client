import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Item, StoryWorld, Story, Character, Location } from '../../supabase-tables';
import { Select, Input, Textarea, Button } from '@/components/ui/form-elements';

interface ItemDetailsProps {
  itemId?: string;
}

export const ItemDetails: React.FC<ItemDetailsProps> = ({ itemId }) => {
  const supabase = useSupabaseClient();
  const [item, setItem] = useState<Item | null>(null);
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
    if (itemId) {
      fetchItem(itemId);
    }
  }, [itemId]);

  // Fetch related data when storyworld changes
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

  const fetchItem = async (id: string) => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching item:', error);
      return;
    }
    
    setItem(data);
    setSelectedStoryWorld(data.story_world_id || '');
    setSelectedStory(data.story_id || '');
  };

  const handleSave = async () => {
    if (!item) return;

    const { error } = await supabase
      .from('items')
      .update({
        ...item,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    if (error) {
      console.error('Error saving item:', error);
      return;
    }

    setIsEditing(false);
    setLastCheckTime(new Date().toISOString());
  };

  const handleInputChange = (field: keyof Item, value: any) => {
    if (!item) return;
    
    setItem({
      ...item,
      [field]: value
    });
  };

  if (!item) return <div>Select an item to view details</div>;

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
              value={item.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Item Type</label>
            <Select
              value={item.item_type || ''}
              onChange={(e) => handleInputChange('item_type', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select Type</option>
              <option value="weapon">Weapon</option>
              <option value="tool">Tool</option>
              <option value="clothing">Clothing</option>
              <option value="magical">Magical</option>
              <option value="technology">Technology</option>
              <option value="document">Document</option>
              <option value="other">Other</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Current Owner</label>
            <Select
              value={item.owner_character_id || ''}
              onChange={(e) => handleInputChange('owner_character_id', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select Owner</option>
              {characters.map(char => (
                <option key={char.id} value={char.id}>{char.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Current Location</label>
            <Select
              value={item.location_id || ''}
              onChange={(e) => handleInputChange('location_id', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select Location</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={item.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Properties</label>
            <Textarea
              value={item.properties || ''}
              onChange={(e) => handleInputChange('properties', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Significance</label>
            <Textarea
              value={item.significance || ''}
              onChange={(e) => handleInputChange('significance', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">History</label>
            <Textarea
              value={item.history || ''}
              onChange={(e) => handleInputChange('history', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Textarea
              value={item.notes || ''}
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