import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Character, StoryWorld } from '../supabase-tables';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

// For JSON fields that we need to display in a form
interface AttributesForm {
  [key: string]: string;
}

interface RelationshipForm {
  characterId: string;
  relationshipType: string;
}

const CharacterDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewCharacter = id === 'new';
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storyWorlds, setStoryWorlds] = useState<StoryWorld[]>([]);
  
  // Character form state
  const [character, setCharacter] = useState<Partial<Character>>({
    name: '',
    role: 'other', // Changed from empty string to 'other' to match enum type
    description: '',
    story_world_id: '',
    attributes: {},
    relationships: {},
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
        
        // If this is a new character and we have story worlds, select the first one by default
        if (isNewCharacter && data && data.length > 0) {
          setCharacter(prev => ({ ...prev, story_world_id: data[0].id }));
        }
      } catch (error: any) {
        toast.error(`Error fetching story worlds: ${error.message}`);
        console.error('Error fetching story worlds:', error);
      }
    };

    fetchStoryWorlds();
  }, [isNewCharacter]);

  // Load character data if editing an existing character
  useEffect(() => {
    if (isNewCharacter) return;
    
    const fetchCharacter = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setCharacter(data);
          
          // Initialize attributes form state from JSON
          if (data.attributes) {
            setAttributes(data.attributes as AttributesForm);
          }
        }
      } catch (error: any) {
        toast.error(`Error fetching character: ${error.message}`);
        console.error('Error fetching character:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [id, isNewCharacter]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCharacter(prev => ({ ...prev, [name]: value }));
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
      
      // Prepare the character data with JSON fields
      const characterData = {
        ...character,
        attributes: attributes,
      };
      
      let result;
      
      if (isNewCharacter) {
        result = await supabase
          .from('characters')
          .insert([characterData]);
      } else {
        result = await supabase
          .from('characters')
          .update(characterData)
          .eq('id', id);
      }
      
      const { error } = result;
      
      if (error) {
        throw error;
      }
      
      toast.success(`Character ${isNewCharacter ? 'created' : 'updated'} successfully`);
      navigate('/characters');
    } catch (error: any) {
      toast.error(`Error ${isNewCharacter ? 'creating' : 'updating'} character: ${error.message}`);
      console.error(`Error ${isNewCharacter ? 'creating' : 'updating'} character:`, error);
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
            onClick={() => navigate('/characters')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <FaArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold">
            {isNewCharacter ? 'Create New Character' : 'Edit Character'}
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
            value={character.story_world_id || ''}
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
            Name *
          </label>
          <input
            type="text"
            name="name"
            value={character.name || ''}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            name="role"
            value={character.role || 'other'}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="protagonist">Protagonist</option>
            <option value="antagonist">Antagonist</option>
            <option value="supporting">Supporting</option>
            <option value="background">Background</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={character.description || ''}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Describe the character..."
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
            Add attributes like age, height, personality traits, etc.
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
                <FaSave className="mr-2" /> Save Character
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CharacterDetailPage;