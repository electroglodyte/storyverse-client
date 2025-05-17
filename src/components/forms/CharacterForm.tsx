import React from 'react';
import { Character } from '../../types/database';
import { EntityForm, FormFieldDefinition } from './EntityForm';

interface CharacterFormProps {
  onSubmit: (data: Partial<Character>) => Promise<void>;
  initialData?: Partial<Character>;
  loading?: boolean;
}

const characterFields: FormFieldDefinition[] = [
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    validation: { required: true, maxLength: 100 },
    placeholder: 'Character name'
  },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    options: [
      { value: 'protagonist', label: 'Protagonist' },
      { value: 'antagonist', label: 'Antagonist' },
      { value: 'supporting', label: 'Supporting' },
      { value: 'background', label: 'Background' },
      { value: 'other', label: 'Other' }
    ],
    validation: { required: true }
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    placeholder: 'Brief description of the character'
  },
  {
    name: 'appearance',
    label: 'Appearance',
    type: 'textarea',
    placeholder: 'Physical description'
  },
  {
    name: 'background',
    label: 'Background',
    type: 'textarea',
    placeholder: 'Character history and background'
  },
  {
    name: 'motivation',
    label: 'Motivation',
    type: 'textarea',
    placeholder: 'What drives this character'
  },
  {
    name: 'personality',
    label: 'Personality',
    type: 'textarea',
    placeholder: 'Character traits and personality'
  },
  {
    name: 'age',
    label: 'Age',
    type: 'text',
    placeholder: 'Character age or age range'
  },
  {
    name: 'image_url',
    label: 'Image URL',
    type: 'text',
    placeholder: 'URL to character image'
  },
  {
    name: 'notes',
    label: 'Additional Notes',
    type: 'textarea',
    placeholder: 'Any other important information'
  }
];

export const CharacterForm: React.FC<CharacterFormProps> = ({
  onSubmit,
  initialData,
  loading
}) => {
  return (
    <EntityForm
      fields={characterFields}
      onSubmit={onSubmit}
      initialData={initialData}
      loading={loading}
      submitLabel={initialData ? 'Update Character' : 'Create Character'}
    />
  );
};

export default CharacterForm;