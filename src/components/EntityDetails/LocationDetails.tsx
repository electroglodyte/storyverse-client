import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Location, StoryWorld } from '@/types/story';
import { Input, Select, Textarea, Button } from '@/components/ui/form-elements';

interface LocationDetailsProps {
  location: Location;
  storyWorlds: StoryWorld[];
  parentLocations?: Location[];
  onSave: (location: Location) => void;
}

export const LocationDetails: React.FC<LocationDetailsProps> = ({
  location,
  storyWorlds,
  parentLocations = [],
  onSave,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Location>(location);
  const [locationAttributes, setLocationAttributes] = useState<Record<string, any>>(
    location.attributes || {}
  );

  useEffect(() => {
    setFormData(location);
    setLocationAttributes(location.attributes || {});
  }, [location]);

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
    setLocationAttributes(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    const updatedLocation = {
      ...formData,
      attributes: locationAttributes
    };
    await onSave(updatedLocation);
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
          <label className="block text-sm font-medium mb-1">Location Type</label>
          <Select
            name="location_type"
            value={formData.location_type || ''}
            onChange={handleSelectChange}
            className="w-full"
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
          <label className="block text-sm font-medium mb-1">Climate</label>
          <Textarea
            name="climate"
            value={formData.climate || ''}
            onChange={handleInputChange}
            className="w-full h-32"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Culture</label>
          <Textarea
            name="culture"
            value={formData.culture || ''}
            onChange={handleInputChange}
            className="w-full h-32"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Notable Features</label>
          <Textarea
            name="notable_features"
            value={formData.notable_features || ''}
            onChange={handleInputChange}
            className="w-full h-32"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Map Coordinates</label>
          <Input
            name="map_coordinates"
            value={formData.map_coordinates || ''}
            onChange={handleInputChange}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <label className="block text-sm font-medium mb-1">Parent Location</label>
          <Select
            name="parent_location_id"
            value={formData.parent_location_id || ''}
            onChange={handleSelectChange}
            className="w-full"
          >
            <option value="">None</option>
            {parentLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <Textarea
          name="notes"
          value={formData.notes || ''}
          onChange={handleInputChange}
          className="w-full h-32"
        />
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