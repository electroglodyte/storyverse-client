import React from 'react';
import { Faction, Character, StoryWorld } from '@/types/database';
import { Select, Input, Textarea, Button } from '@/components/ui/form-elements';

interface FactionDetailsProps {
  faction: Faction;
  onSave?: (faction: Partial<Faction>) => void;
  onDelete?: () => void;
  onMemberSelect?: (character: Character) => void;
  storyWorld?: StoryWorld;
  availableCharacters?: Character[];
}

export const FactionDetails: React.FC<FactionDetailsProps> = ({
  faction,
  onSave,
  onDelete,
  onMemberSelect,
  storyWorld,
  availableCharacters = [],
}) => {
  const [formData, setFormData] = React.useState<Partial<Faction>>({
    name: faction.name,
    description: faction.description,
    faction_type: faction.faction_type,
    ideology: faction.ideology,
    goals: faction.goals,
    resources: faction.resources,
    notes: faction.notes,
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
        label="Type"
        name="faction_type"
        value={formData.faction_type || ''}
        onChange={handleInputChange}
        options={[
          { value: 'government', label: 'Government' },
          { value: 'organization', label: 'Organization' },
          { value: 'family', label: 'Family' },
          { value: 'species', label: 'Species' },
          { value: 'religion', label: 'Religion' },
          { value: 'other', label: 'Other' },
        ]}
      />

      <Textarea
        label="Description"
        name="description"
        value={formData.description || ''}
        onChange={handleInputChange}
      />

      <Textarea
        label="Ideology"
        name="ideology"
        value={formData.ideology || ''}
        onChange={handleInputChange}
      />

      <Textarea
        label="Goals"
        name="goals"
        value={formData.goals || ''}
        onChange={handleInputChange}
      />

      <Textarea
        label="Resources"
        name="resources"
        value={formData.resources || ''}
        onChange={handleInputChange}
      />

      {availableCharacters.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Members</h3>
          <div className="grid grid-cols-2 gap-4">
            {availableCharacters.map(character => (
              <div
                key={character.id}
                className="p-2 border rounded cursor-pointer hover:bg-gray-100"
                onClick={() => onMemberSelect?.(character)}
              >
                {character.name}
              </div>
            ))}
          </div>
        </div>
      )}

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
            Delete Faction
          </Button>
        )}
      </div>
    </form>
  );
};
