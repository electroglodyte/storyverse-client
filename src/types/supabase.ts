import { Database } from './database';

export type Tables = Database['public']['Tables'];

export type {
  Character,
  Event,
  Faction,
  Location,
  Scene,
  Series,
  Story,
  StoryWorld,
  StyleProfile,
  WritingSample,
  SceneVersion,
  StyleAnalysis,
} from './database';

export type ExtendedStory = Tables['stories']['Row'] & {
  storyworld?: Tables['story_worlds']['Row'];
  series?: Tables['series']['Row'];
};

export type ExtendedScene = Tables['scenes']['Row'] & {
  commentCount?: number;
};

export type ProfileSample = {
  id: string;
  title: string;
  author: string;
  sample_type: string; 
  word_count: number;
  content: string;
  excerpt: string;
  weight: number;
};

export type ProfileWithStyle = {
  id: string;
  name: string;
  description: string;
  weight: number;
};