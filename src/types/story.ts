import {
  StoryWorld,
  Series,
  Story,
  Character,
  Location,
  Faction,
  Object,
  CharacterRelationship,
  CharacterEvent,
  CharacterArc,
  Event,
  Plotline,
  Scene,
  SceneVersion,
  SceneComment,
  StoryQuestion,
  EventDependency,
  WritingSample,
  StyleProfile
} from '../supabase-tables';

// Extended types with additional type safety

export interface ExtendedCharacter extends Character {
  relationships?: CharacterRelationship[];
  events?: (CharacterEvent & { event: Event })[];
  arcs?: CharacterArc[];
}

export interface ExtendedLocation extends Location {
  children?: Location[];
  parent?: Location | null;
}

export interface ExtendedFaction extends Faction {
  members?: { character: Character; role: string }[];
  leader?: Character | null;
  headquarters?: Location | null;
}

export interface ExtendedEvent extends Event {
  dependencies?: EventDependency[];
  characters?: (CharacterEvent & { character: Character })[];
  plotlines?: Plotline[];
  scene?: Scene;
}

export interface ExtendedScene extends Scene {
  version_history?: SceneVersion[];
  comments?: SceneComment[];
  characters?: { character: Character; importance: string }[];
  locations?: Location[];
  event?: Event;
}

export interface ExtendedPlotline extends Plotline {
  events?: Event[];
  characters?: Character[];
  starting_event?: Event;
  climax_event?: Event;
  resolution_event?: Event;
}

export interface ExtendedStoryQuestion extends StoryQuestion {
  origin_scene?: Scene;
  resolution_scene?: Scene;
}

// Type guards
export const isCharacter = (obj: any): obj is Character => {
  return obj && typeof obj === 'object' && 'name' in obj && (!('type' in obj) || obj.type === 'character');
};

export const isLocation = (obj: any): obj is Location => {
  return obj && typeof obj === 'object' && 'name' in obj && (!('type' in obj) || obj.type === 'location');
};

export const isFaction = (obj: any): obj is Faction => {
  return obj && typeof obj === 'object' && 'name' in obj && (!('type' in obj) || obj.type === 'faction');
};

export const isEvent = (obj: any): obj is Event => {
  return obj && typeof obj === 'object' && 'title' in obj && 'sequence_number' in obj;
};

export const isScene = (obj: any): obj is Scene => {
  return obj && typeof obj === 'object' && 'title' in obj && 'type' in obj && obj.type.startsWith('scene');
};

// Utility types
export type EntityType = 'character' | 'location' | 'faction' | 'object' | 'event' | 'scene';

export type EntityBase = Character | Location | Faction | Object | Event | Scene;

export type ExtendedEntityBase = 
  | ExtendedCharacter 
  | ExtendedLocation 
  | ExtendedFaction 
  | Object 
  | ExtendedEvent 
  | ExtendedScene;

export interface EntityReference {
  id: string;
  type: EntityType;
  name: string;
}

// Form-related types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date' | 'boolean';
  required?: boolean;
  options?: { label: string; value: string | number }[];
  placeholder?: string;
  helperText?: string;
}

export interface EntityFormProps<T extends EntityBase> {
  initialData?: Partial<T>;
  onSubmit: (data: T) => Promise<void>;
  fields: FormField[];
  isLoading?: boolean;
}
