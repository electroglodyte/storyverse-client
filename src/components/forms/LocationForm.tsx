import React from 'react';
import { Location } from '../../types/database';
import { EntityForm, FormFieldDefinition } from './EntityForm';

interface LocationFormProps {
  onSubmit: (data: Partial<Location>) => Promise<void>;
  initialData?: Partial<Location>;
  loading?: boolean;
}

const locationFields: FormFieldDefinition[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    validation: { required: true, maxLength: 100 },
    placeholder: 'Location name'
  },
  {
    name: 'location_type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'city', label: 'City' },
      { value: 'building', label: 'Building' },
      { value: 'natural', label: 'Natural' },
      { value: 'country', label: 'Country' },
      { value: 'planet', label: 'Planet' },
      { value: 'realm', label: 'Realm' },
      { value: 'other', label: 'Other' }
    ],
    validation: { required: true }
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    placeholder: 'Brief description of the location'
  },
  {
    name: 'climate',
    label: 'Climate',
    type: 'textarea',
    placeholder: 'Climate conditions'
  },
  {
    name: 'culture',
    label: 'Culture',
    type: 'textarea',
    placeholder: 'Cultural aspects'
  },
  {
    name: 'map_coordinates',
    label: 'Map Coordinates',
    type: 'text',
    placeholder: 'Location coordinates or position'
  },
  {
    name: 'notable_features',
    label: 'Notable Features',
    type: 'textarea',
    placeholder: 'Distinctive characteristics'
  },
  {
    name: 'image_url',
    label: 'Image URL',
    type: 'text',
    placeholder: 'URL to location image'
  },
  {
    name: 'time_period',
    label: 'Time Period',
    type: 'text',
    placeholder: 'Historical period or era'
  },
  {
    name: 'notes',
    label: 'Additional Notes',
    type: 'textarea',
    placeholder: 'Any other important information'
  }
];

export const LocationForm: React.FC<LocationFormProps> = ({
  onSubmit,
  initialData,
  loading
}) => {
  return (
    <EntityForm
      fields={locationFields}
      onSubmit={onSubmit}
      initialData={initialData}
      loading={loading}
      submitLabel={initialData ? 'Update Location' : 'Create Location'}
    />
  );
};

export default LocationForm;