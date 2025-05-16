import React from 'react';
import { Character, Story, StoryWorld } from '@/types/database';
import { Select, Input, Textarea, Button } from '@/components/ui/form-elements';

interface CharacterDetailsProps {
  character: Character;
  onSave?: (character: Partial<Character>) => void;
  onDelete?: () => void;
  story?: Story;
  storyWorld?: StoryWorld;
}

export const CharacterDetails: React.FC<CharacterDetailsProps> = ({
  character,
  onSave,
  onDelete,
  story,
  storyWorld,
}) => {
  const [formData, setFormData] = React.useState<Partial<Character>>({
    name: character.name,
    description: character.description,
    role: character.role,
    appearance: character.appearance,
    background: character.background,
    motivation: character.motivation,
    personality: character.personality,
    age: character.age,
    notes: character.notes,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        name="name"
        value={formData.name || ''}
        onChange={handleInputChange}
        required
      />

      <Select
        label="Role"
        name="role"
        value={formData.role || ''}
        onChange={handleInputChange}
        options={[
          { value: 'protagonist', label: 'Protagonist' },
          { value: 'antagonist', label: 'Antagonist' },
          { value: 'supporting', label: 'Supporting' },
          { value: 'background', label: 'Background' },
        ]}
      />

      <Textarea
        label="Description"
        name="description"
        value={formData.description || ''}
        onChange={handleInputChange}
      />

      <Input
        label="Age"
        name="age"
        value={formData.age || ''}
        onChange={handleInputChange}
      />

      <Textarea
        label="Appearance"
        name="appearance"
        value={formData.appearance || ''}
        onChange={handleInputChange}
      />

      <Textarea
        label="Background"
        name="background"
        value={formData.background || ''}
        onChange={handleInputChange}
      />

      <Textarea
        label="Motivation"
        name="motivation"
        value={formData.motivation || ''}
        onChange={handleInputChange}
      />

      <Textarea
        label="Personality"
        name="personality"
        value={formData.personality || ''}
        onChange={handleInputChange}
      />

      <Textarea
        label="Notes"
        name="notes"
        value={formData.notes || ''}
        onChange={handleInputChange}
      />

      <div className="flex space-x-4">
        <Button type="submit">Save Changes</Button>
        {onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            Delete Character
          </Button>
        )}
      </div>
    </form>
  );
};
