import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Character, StoryWorld } from '@/types/story';
import { Input, Select, Textarea, Button } from '@/components/ui/form-elements';

interface CharacterDetailsProps {
  character: Character;
  storyWorlds: StoryWorld[];
  onSave: (character: Character) => void;
}

export const CharacterDetails: React.FC<CharacterDetailsProps> = ({
  character,
  storyWorlds,
  onSave,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Character>(character);
  const [charAttributes, setCharAttributes] = useState<Record<string, any>>(
    character.attributes || {}
  );

  useEffect(() => {
    setFormData(character);
    setCharAttributes(character.attributes || {});
  }, [character]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAttributeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCharAttributes(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    const updatedCharacter = {
      ...formData,
      attributes: charAttributes
    };
    await onSave(updatedCharacter);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <Select
            name="role"
            value={formData.role || ''}
            onChange={handleSelectChange}
            className="w-full"
          >
            <option value="">Select Role</option>
            <option value="protagonist">Protagonist</option>
            <option value="antagonist">Antagonist</option>
            <option value="supporting">Supporting</option>
            <option value="background">Background</option>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          name="description"
          value={formData.description || ''}
          onChange={handleInputChange}
          className="w-full h-32"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Background</label>
          <Textarea
            name="background"
            value={formData.background || ''}
            onChange={handleInputChange}
            className="w-full h-32"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Appearance</label>
          <Textarea
            name="appearance"
            value={formData.appearance || ''}
            onChange={handleInputChange}
            className="w-full h-32"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Personality</label>
          <Textarea
            name="personality"
            value={formData.personality || ''}
            onChange={handleInputChange}
            className="w-full h-32"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Motivation</label>
          <Textarea
            name="motivation"
            value={formData.motivation || ''}
            onChange={handleInputChange}
            className="w-full h-32"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Age</label>
          <Input
            name="age"
            value={formData.age || ''}
            onChange={handleInputChange}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Story World</label>
          <Select
            name="story_world_id"
            value={formData.story_world_id || ''}
            onChange={handleSelectChange}
            className="w-full"
          >
            <option value="">Select Story World</option>
            {storyWorlds.map((world) => (
              <option key={world.id} value={world.id}>
                {world.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-x-4">
        <Button onClick={handleSave} className="bg-blue-500 text-white">
          Save Changes
        </Button>
        <Button onClick={() => navigate(-1)} className="bg-gray-500 text-white">
          Cancel
        </Button>
      </div>
    </div>
  );
};