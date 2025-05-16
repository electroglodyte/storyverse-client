import React from 'react';
import { Location, Story, StoryWorld } from '@/types/database';
import { Select, Input, Textarea, Button } from '@/components/ui/form-elements';

interface LocationDetailsProps {
  location: Location;
  onSave?: (location: Partial<Location>) => void;
  onDelete?: () => void;
  story?: Story;
  storyWorld?: StoryWorld;
  parentLocations?: Location[];
}

export const LocationDetails: React.FC<LocationDetailsProps> = ({
  location,
  onSave,
  onDelete,
  story,
  storyWorld,
  parentLocations = [],
}) => {
  const [formData, setFormData] = React.useState<Partial<Location>>({
    name: location.name,
    description: location.description,
    location_type: location.location_type,
    parent_location_id: location.parent_location_id,
    climate: location.climate,
    culture: location.culture,
    map_coordinates: location.map_coordinates,
    notable_features: location.notable_features,
    notes: location.notes,
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
        name="location_type"
        value={formData.location_type || ''}
        onChange={handleInputChange}
        options={[
          { value: 'city', label: 'City' },
          { value: 'building', label: 'Building' },
          { value: 'natural', label: 'Natural' },
          { value: 'country', label: 'Country' },
          { value: 'planet', label: 'Planet' },
          { value: 'realm', label: 'Realm' },
          { value: 'other', label: 'Other' },
        ]}
      />

      {parentLocations.length > 0 && (
        <Select
          label="Parent Location"
          name="parent_location_id"
          value={formData.parent_location_id || ''}
          onChange={handleInputChange}
          options={[
            { value: '', label: 'None' },
            ...parentLocations.map(loc => ({
              value: loc.id,
              label: loc.name,
            })),
          ]}
        />
      )}

      <Textarea
        label="Description"
        name="description"
        value={formData.description || ''}
        onChange={handleInputChange}
      />

      <Input
        label="Climate"
        name="climate"
        value={formData.climate || ''}
        onChange={handleInputChange}
      />

      <Input
        label="Culture"
        name="culture"
        value={formData.culture || ''}
        onChange={handleInputChange}
      />

      <Input
        label="Map Coordinates"
        name="map_coordinates"
        value={formData.map_coordinates || ''}
        onChange={handleInputChange}
      />

      <Textarea
        label="Notable Features"
        name="notable_features"
        value={formData.notable_features || ''}
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
            Delete Location
          </Button>
        )}
      </div>
    </form>
  );
};
