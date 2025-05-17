import React from 'react';
import { Faction } from '../../types/database';
import { EntityForm, FormFieldDefinition } from './EntityForm';

interface FactionFormProps {
  onSubmit: (data: Partial<Faction>) => Promise<void>;
  initialData?: Partial<Faction>;
  loading?: boolean;
}

const factionFields: FormFieldDefinition[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    validation: { required: true, maxLength: 100 },
    placeholder: 'Faction name'
  },
  {
    name: 'faction_type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'government', label: 'Government' },
      { value: 'organization', label: 'Organization' },
      { value: 'family', label: 'Family' },
      { value: 'species', label: 'Species' },
      { value: 'religion', label: 'Religion' },
      { value: 'other', label: 'Other' }
    ],
    validation: { required: true }
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    placeholder: 'Brief description of the faction'
  },
  {
    name: 'ideology',
    label: 'Ideology',
    type: 'textarea',
    placeholder: 'Core beliefs and principles'
  },
  {
    name: 'goals',
    label: 'Goals',
    type: 'textarea',
    placeholder: 'What this faction aims to achieve'
  },
  {
    name: 'resources',
    label: 'Resources',
    type: 'textarea',
    placeholder: 'Available resources and capabilities'
  },
  {
    name: 'image_url',
    label: 'Image URL',
    type: 'text',
    placeholder: 'URL to faction image'
  },
  {
    name: 'notes',
    label: 'Additional Notes',
    type: 'textarea',
    placeholder: 'Any other important information'
  }
];

export const FactionForm: React.FC<FactionFormProps> = ({
  onSubmit,
  initialData,
  loading
}) => {
  return (
    <EntityForm
      fields={factionFields}
      onSubmit={onSubmit}
      initialData={initialData}
      loading={loading}
      submitLabel={initialData ? 'Update Faction' : 'Create Faction'}
    />
  );
};

export default FactionForm;