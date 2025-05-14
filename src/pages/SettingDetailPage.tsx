import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Location, StoryWorld } from '../supabase-tables';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

// For JSON attributes field
interface AttributesForm {
  [key: string]: string;
}

const LocationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewLocation = id === 'new';
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([]);
  const [availableParentLocations, setAvailableParentLocations] = useState<Location[]>([]);
  
  // Location form state
  const [location, setLocation] = useState<Partial<Location>>({
    name: '',
    location_type: 'other', // Set a default valid value
    time_period: '',
    description: '',
    story_world_id: '',
    parent_location_id: '',
    attributes: {},
  });
  
  // Form specific state for JSON fields
  const [attributes, setAttributes] = useState<AttributesForm>({});
  const [newAttributeKey, setNewAttributeKey] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');
  
  // Load story worlds on initial render
  useEffect(() => {
    const fetchStoryWorlds = async () => {
      try {
        const { data, error } = await supabase
          .from('story_worlds')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          throw error;
        }

        setStoryWorlds(data || []);
        
        // If this is a new location and we have story worlds, select the first one by default
        if (isNewLocation && data && data.length > 0) {
          setLocation(prev => ({ ...prev, story_world_id: data[0].id }));
          // Load available parent locations for the selected story world
          fetchParentLocations(data[0].id);
        }
      } catch (error: any) {
        toast.error(`Error fetching story worlds: ${error.message}`);
        console.error('Error fetching story worlds:', error);
      }
    };

    fetchStoryWorlds();
  }, [isNewLocation]);

  // Fetch available parent locations when story world is selected or changed
  const fetchParentLocations = async (storyWorldId: string) => {
    if (!storyWorldId) return;
    
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('story_world_id', storyWorldId)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      // When editing a location, we need to exclude the current location and any of its children
      const filteredLocations = isNewLocation 
        ? data || [] 
        : (data || []).filter(s => s.id !== id);
        
      setAvailableParentLocations(filteredLocations);
    } catch (error: any) {
      toast.error(`Error fetching parent locations: ${error.message}`);
      console.error('Error fetching parent locations:', error);
    }
  };

  // Load location data if editing an existing location
  useEffect(() => {
    if (isNewLocation) return;
    
    const fetchLocation = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setLocation(data);
          
          // Fetch parent locations for the location's story world
          if (data.story_world_id) {
            fetchParentLocations(data.story_world_id);
          }
          
          // Initialize attributes form state from JSON
          if (data.attributes) {
            setAttributes(data.attributes as AttributesForm);
          }
        }
      } catch (error: any) {
        toast.error(`Error fetching location: ${error.message}`);
        console.error('Error fetching location:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [id, isNewLocation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If story_world_id changes, update available parent locations
    if (name === 'story_world_id' && value !== location.story_world_id) {
      fetchParentLocations(value);
      // Clear parent location when story world changes
      setLocation(prev => ({ ...prev, [name]: value, parent_location_id: '' }));
    } else {
      setLocation(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAttributeChange = (key: string, value: string) => {
    setAttributes(prev => ({ ...prev, [key]: value }));
  };

  const addAttribute = () => {
    if (!newAttributeKey.trim()) {
      toast.error('Attribute key cannot be empty');
      return;
    }
    
    setAttributes(prev => ({ ...prev, [newAttributeKey]: newAttributeValue }));
    setNewAttributeKey('');
    setNewAttributeValue('');
  };

  const removeAttribute = (key: string) => {
    const newAttributes = { ...attributes };
    delete newAttributes[key];
    setAttributes(newAttributes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      // Prepare the location data with JSON fields
      const locationData = {
        ...location,
        attributes: attributes,
      };
      
      let result;
      
      if (isNewLocation) {
        result = await supabase
          .from('settings')
          .insert([locationData]);
      } else {
        result = await supabase
          .from('settings')
          .update(locationData)
          .eq('id', id);
      }
      
      const { error } = result;
      
      if (error) {
        throw error;
      }
      
      toast.success(`Location ${isNewLocation ? 'created' : 'updated'} successfully`);
      navigate('/locations');
    } catch (error: any) {
      toast.error(`Error ${isNewLocation ? 'creating' : 'updating'} location: ${error.message}`);
      console.error(`Error ${isNewLocation ? 'creating' : 'updating'} location:`, error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/locations')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <FaArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold">
            {isNewLocation ? 'Create New Location' : 'Edit Location'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Story World *
          </label>
          <select
            name="story_world_id"
            value={location.story_world_id || ''}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select a Story World</option>
            {storyWorlds.map((world) => (
              <option key={world.id} value={world.id}>
                {world.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parent Location (Optional)
          </label>
          <select
            name="parent_location_id"
            value={location.parent_location_id || ''}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">No Parent (Top Level)</option>
            {availableParentLocations.map((parentLocation) => (
              <option key={parentLocation.id} value={parentLocation.id}>
                {parentLocation.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            If this location is inside another location (e.g., a room in a building), select the parent.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            name="name"
            value={location.name || ''}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location Type
          </label>
          <select
            name="location_type"
            value={location.location_type || 'other'}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="city">City</option>
            <option value="building">Building</option>
            <option value="natural">Natural</option>
            <option value="country">Country</option>
            <option value="planet">Planet</option>
            <option value="realm">Realm</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Period
          </label>
          <input
            type="text"
            name="time_period"
            value={location.time_period || ''}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., Modern Day, Victorian Era, Future, 1920s"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={location.description || ''}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Describe the location..."
          />
        </div>

        {/* Attributes Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attributes
          </label>
          
          <div className="mb-4">
            {Object.entries(attributes).map(([key, value]) => (
              <div key={key} className="flex mb-2">
                <input
                  type="text"
                  value={key}
                  disabled
                  className="w-1/3 mr-2 rounded-md border-gray-300 shadow-sm bg-gray-50"
                />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleAttributeChange(key, e.target.value)}
                  className="flex-1 mr-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeAttribute(key)}
                  className="px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex">
            <input
              type="text"
              value={newAttributeKey}
              onChange={(e) => setNewAttributeKey(e.target.value)}
              placeholder="Attribute name"
              className="w-1/3 mr-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="text"
              value={newAttributeValue}
              onChange={(e) => setNewAttributeValue(e.target.value)}
              placeholder="Attribute value"
              className="flex-1 mr-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addAttribute}
              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Add attributes like climate, population, size, danger level, etc.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            {saving ? (
              <>
                <LoadingSpinner size="small" /> <span className="ml-2">Saving...</span>
              </>
            ) : (
              <>
                <FaSave className="mr-2" /> Save Location
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocationDetailPage;