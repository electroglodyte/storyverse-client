/**
 * StoryVerse Database Schema Types
 * Generated for Supabase project: rkmjjhjjpnhjymqmcvpe
 */

/**
 * StoryWorld Type
 */
export interface StoryWorld {
  id: string; // uuid
  name: string;
  description: string | null;
  created_at: string | null; // timestamp
  updated_at: string | null; // timestamp
  user_id: string | null; // references auth.users
  cover_image: string | null;
  tags: string[] | null;
}

/**
 * Series Type
 */
export interface Series {
  id: string; // uuid
  name: string;
  description: string | null;
  storyworld_id: string | null; // references StoryWorld
  created_at: string | null; // timestamp
  updated_at: string | null; // timestamp
  user_id: string | null; // references auth.users
  cover_image: string | null;
  sequence_type: string | null;
}

/**
 * Series-Stories Junction Type
 */
export interface SeriesStory {
  id: string; // uuid
  series_id: string | null; // references Series
  story_id: string | null; // references Story
  sequence_number: number | null;
  created_at: string | null; // timestamp
}

/**
 * Core Story Type (renamed from Project)
 */
export interface Story {
  id: string; // uuid
  name: string;
  description: string | null;
  created_at: string | null; // timestamp
  updated_at: string | null; // timestamp
  status: string | null; // default: 'active'
  cover_image_url: string | null;
  genre: string[] | null;
  tags: string[] | null;
  storyworld_id: string | null; // references StoryWorld
  series_id: string | null; // references Series
}

/**
 * Writing Sample Type
 */
export interface WritingSample {
  id: string; // uuid
  title: string;
  content: string;
  author: string | null;
  created_at: string | null; // timestamp
  updated_at: string | null; // timestamp
  sample_type: string | null;
  tags: string[] | null;
  word_count: number | null; // generated from content
  excerpt: string | null;
  story_id: string | null; // references Story (renamed from project_id)
}

/**
 * Style Analysis Type
 */
export interface StyleAnalysis {
  id: string; // uuid
  sample_id: string | null; // references WritingSample
  created_at: string | null; // timestamp
  sentence_metrics: Record<string, any>; // jsonb
  vocabulary_metrics: Record<string, any>; // jsonb
  narrative_characteristics: Record<string, any>; // jsonb
  stylistic_devices: Record<string, any>; // jsonb
  tone_attributes: Record<string, any>; // jsonb
  comparable_authors: string[] | null;
  descriptive_summary: string;
}

/**
 * Dialogue Analysis Type
 */
export interface DialogueAnalysis {
  id: string; // uuid
  sample_id: string | null; // references WritingSample
  created_at: string | null; // timestamp
  dialogue_metrics: Record<string, any>; // jsonb
  voice_differentiation: Record<string, any>; // jsonb
  subtext_metrics: Record<string, any>; // jsonb
  identified_techniques: Record<string, any>[] | null; // jsonb[]
  dialogue_summary: string;
}

/**
 * Dialogue Techniques Reference Type
 */
export interface DialogueTechnique {
  id: string; // uuid
  name: string; // unique
  description: string;
  example: string;
  purpose: string[] | null;
  common_contexts: string[] | null;
  tags: string[] | null;
  related_technique_ids: string[] | null; // uuid[]
}

/**
 * Style Profile Type
 */
export interface StyleProfile {
  id: string; // uuid
  name: string;
  description: string | null;
  created_at: string | null; // timestamp
  updated_at: string | null; // timestamp
  style_parameters: Record<string, any>; // jsonb
  dialogue_parameters: Record<string, any> | null; // jsonb
  example_passages: string[] | null;
  notes: string | null;
  story_specific: boolean | null; // renamed from project_specific, default: false
  story_name: string | null; // renamed from project_name
  story_id: string | null; // references Story (renamed from project_id)
}

/**
 * Profile Sample Junction Type
 */
export interface ProfileSample {
  id: string; // uuid
  profile_id: string | null; // references StyleProfile
  sample_id: string | null; // references WritingSample
  added_at: string | null; // timestamp
  weight: number | null; // default: 1.0
}

/**
 * Reference Author Type
 */
export interface ReferenceAuthor {
  id: string; // uuid
  name: string; // unique
  time_period: string | null;
  primary_genres: string[] | null;
  notable_works: string[] | null;
  known_style_attributes: Record<string, any>; // jsonb
  style_fingerprint: Record<string, any> | null; // jsonb
  reference_links: string[] | null;
}

/**
 * Knowledge Category Type
 */
export interface KnowledgeCategory {
  id: string; // uuid
  name: string; // unique
  description: string | null;
  parent_id: string | null; // references KnowledgeCategory
  created_at: string | null; // timestamp
  story_id: string | null; // references Story (renamed from project_id)
}

/**
 * Writing Knowledge Type
 */
export interface WritingKnowledge {
  id: string; // uuid
  title: string;
  content: string;
  category_id: string | null; // references KnowledgeCategory
  source: string | null;
  importance: number | null; // default: 3
  created_at: string | null; // timestamp
  updated_at: string | null; // timestamp
  tags: string[] | null;
  is_personal: boolean | null; // default: false
  related_knowledge_ids: string[] | null; // uuid[]
  usage_context: string[] | null;
  visibility_trigger: string | null;
  story_id: string | null; // references Story (renamed from project_id)
}

/**
 * Knowledge Example Type
 */
export interface KnowledgeExample {
  id: string; // uuid
  knowledge_id: string | null; // references WritingKnowledge
  excerpt: string;
  source: string | null;
  notes: string | null;
  sample_id: string | null; // references WritingSample
  created_at: string | null; // timestamp
}

/**
 * Knowledge Usage History Type
 */
export interface KnowledgeUsageHistory {
  id: string; // uuid
  knowledge_id: string | null; // references WritingKnowledge
  used_at: string | null; // timestamp
  usage_context: string | null;
  effectiveness: number | null;
}

/**
 * Test Database Type (seems to be a test table)
 */
export interface TestDb {
  id: number;
  created_at: string; // timestamp
  Name: string;
  Rank: string;
}

/**
 * Database Tables Map
 * Maps table names to their TypeScript types
 */
export const TABLES = {
  storyworlds: 'storyworlds' as const,
  series: 'series' as const,
  series_stories: 'series_stories' as const,
  stories: 'stories' as const, // renamed from projects
  writing_samples: 'writing_samples' as const,
  style_analyses: 'style_analyses' as const,
  dialogue_analyses: 'dialogue_analyses' as const,
  dialogue_techniques: 'dialogue_techniques' as const,
  style_profiles: 'style_profiles' as const,
  profile_samples: 'profile_samples' as const,
  reference_authors: 'reference_authors' as const,
  knowledge_categories: 'knowledge_categories' as const,
  writing_knowledge: 'writing_knowledge' as const,
  knowledge_examples: 'knowledge_examples' as const,
  knowledge_usage_history: 'knowledge_usage_history' as const,
  testdb: 'testdb' as const
};

/**
 * Database Schema Type
 * Maps table names to their TypeScript types
 */
export type Database = {
  [TABLES.storyworlds]: StoryWorld;
  [TABLES.series]: Series;
  [TABLES.series_stories]: SeriesStory;
  [TABLES.stories]: Story; // renamed from projects
  [TABLES.writing_samples]: WritingSample;
  [TABLES.style_analyses]: StyleAnalysis;
  [TABLES.dialogue_analyses]: DialogueAnalysis;
  [TABLES.dialogue_techniques]: DialogueTechnique;
  [TABLES.style_profiles]: StyleProfile;
  [TABLES.profile_samples]: ProfileSample;
  [TABLES.reference_authors]: ReferenceAuthor;
  [TABLES.knowledge_categories]: KnowledgeCategory;
  [TABLES.writing_knowledge]: WritingKnowledge;
  [TABLES.knowledge_examples]: KnowledgeExample;
  [TABLES.knowledge_usage_history]: KnowledgeUsageHistory;
  [TABLES.testdb]: TestDb;
};

/**
 * Gets the table name as a string
 * @param table The table constant
 * @returns The table name
 */
export function getTableName<T extends keyof Database>(table: T): string {
  return table;
}
