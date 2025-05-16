import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Location, StoryWorld, Story } from '../../supabase-tables';
import { Select, Input, Textarea, Button } from '@/components/ui/form-elements';

interface LocationDetailsProps {
  locationId?: string;
}

export const LocationDetails: React.FC<LocationDetailsProps> = ({ locationId }) => {
  const supabase = useSupabaseClient();
  const [location, setLocation] = useState<Location | null>(null);
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [parentLocations, setParentLocations] = useState<Location[]>([]);
  const [selectedStoryWorld, setSelectedStoryWorld] = useState<string>('');
  const [selectedStory, setSelectedStory] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchStoryWorlds();
    if (locationId) {
      fetchLocation(locationId);
    }
  }, [locationId]);

  // Fetch stories and available parent locations when storyworld changes
  useEffect(() => {
    if (selectedStoryWorld) {
      fetchStories(selectedStoryWorld);
      fetchParentLocations(selectedStoryWorld);
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

  const fetchParentLocations = async (storyWorldId: string) => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('story_world_id', storyWorldId)
      .order('name');
    
    if (error) {
      console.error('Error fetching parent locations:', error);
      return;
    }
    
    setParentLocations(data);
  };

  const fetchLocation = async (id: string) => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching location:', error);
      return;
    }
    
    setLocation(data);
    setSelectedStoryWorld(data.story_world_id || '');
    setSelectedStory(data.story_id || '');
  };

  const handleSave = async () => {
    if (!location) return;

    const { error } = await supabase
      .from('locations')
      .update({
        ...location,
        updated_at: new Date().toISOString()
      })
      .eq('id', location.id);

    if (error) {
      console.error('Error saving location:', error);
      return;
    }

    setIsEditing(false);
    setLastCheckTime(new Date().toISOString());
  };

  const handleInputChange = (field: keyof Location, value: any) => {
    if (!location) return;
    
    setLocation({
      ...location,
      [field]: value
    });
  };

  if (!location) return <div>Select a location to view details</div>;

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
              value={location.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location Type</label>
            <Select
              value={location.location_type || ''}
              onChange={(e) => handleInputChange('location_type', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select Type</option>
              <option value="city">City</option>
              <option value="building">Building</option>
              <option value="natural">Natural</option>
              <option value="country">Country</option>
              <option value="planet">Planet</option>
              <option value="realm">Realm</option>
              <option value="other">Other</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Parent Location</label>
            <Select
              value={location.parent_location_id || ''}
              onChange={(e) => handleInputChange('parent_location_id', e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Select Parent Location</option>
              {parentLocations
                .filter(loc => loc.id !== location.id)
                .map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))
              }
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={location.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notable Features</label>
            <Textarea
              value={location.notable_features || ''}
              onChange={(e) => handleInputChange('notable_features', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Time Period</label>
            <Input
              value={location.time_period || ''}
              onChange={(e) => handleInputChange('time_period', e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Climate</label>
            <Textarea
              value={location.climate || ''}
              onChange={(e) => handleInputChange('climate', e.target.value)}
              disabled={!isEditing}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Culture</label>
            <Textarea
              value={location.culture || ''}
              onChange={(e) => handleInputChange('culture', e.target.value)}
              disabled={!isEditing}
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Map Coordinates</label>
            <Input
              value={location.map_coordinates || ''}
              onChange={(e) => handleInputChange('map_coordinates', e.target.value)}
              disabled={!isEditing}
              placeholder="Format: lat,long or custom coordinates"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Textarea
              value={location.notes || ''}
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