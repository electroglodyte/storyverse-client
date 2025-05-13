/**
 * Supabase Database Schema for StoryVerse
 * 
 * This file serves as documentation for the Supabase database tables
 * and their relationships.
 */

/**
 * story_worlds table
 * 
 * A Story World is the high-level container for related content.
 */
export interface StoryWorld {
  id: string;               // UUID primary key
  name: string;             // Display name
  description: string;      // Longer description
  tags?: string[];          // Tags for categorization
  cover_image?: string;     // URL to cover image
  created_at: string;       // Timestamp of creation
  updated_at: string;       // Timestamp of last update
  user_id: string;          // Owner of the story world
}

/**
 * series table
 * 
 * A Series groups related stories together in a specific sequence.
 */
export interface Series {
  id: string;               // UUID primary key
  name: string;             // Display name
  description: string;      // Longer description
  storyworld_id: string;    // Foreign key to story_worlds (alias for story_world_id)
  story_world_id: string;   // Foreign key to story_worlds 
  sequence_type: string;    // Chronological, Publication, Narrative, Other
  created_at: string;       // Timestamp of creation
  updated_at: string;       // Timestamp of last update
  user_id: string;          // Owner of the series
}

/**
 * stories table
 * 
 * A Story is an individual creative work.
 */
export interface Story {
  id: string;               // UUID primary key
  title: string;            // Title of the story
  name: string;             // Alias for title
  description: string;      // Synopsis or description
  storyworld_id: string;    // Alias for story_world_id
  story_world_id: string;   // Foreign key to story_worlds
  series_id: string;        // Optional foreign key to series
  series_order: number;     // Optional position in series
  status: string;           // Draft, In Progress, Editing, Complete
  word_count: number;       // Word count of the story
  target_date: string;      // Target completion date
  tags?: string[];          // Tags for categorization
  genre?: string[];         // Genres associated with this story
  created_at: string;       // Timestamp of creation
  updated_at: string;       // Timestamp of last update
  user_id: string;          // Owner of the story
}

/**
 * Extended Story interface with additional properties
 */
export interface ExtendedStory extends Story {
  // Add all properties that are used in the code
  storyworld_id: string;    // Alias for story_world_id
  story_world_id: string;   // Foreign key to story_worlds
  tags?: string[];          // Tags for categorization
  genre?: string[];         // Genres for the story
}

/**
 * writing_samples table
 * 
 * Writing Samples are text excerpts that can be analyzed for style.
 */
export interface WritingSample {
  id: string;               // UUID primary key
  title: string;            // Title of the sample
  text: string;             // The sample text content
  content?: string;         // Alias for text content
  excerpt?: string;         // Short excerpt
  author: string;           // Author of the sample
  sample_type: string;      // Type of writing (novel, screenplay, etc.)
  project_id: string;       // Associated project
  tags: string[];           // Array of tags for categorization
  word_count?: number;      // Word count of the sample
  created_at: string;       // Timestamp of creation
  updated_at: string;       // Timestamp of last update
  user_id: string;          // Owner of the sample
}

/**
 * style_profiles table
 * 
 * Style Profiles capture the writing style from analyzed samples.
 */
export interface StyleProfile {
  id: string;               // UUID primary key
  name: string;             // Name of the style profile
  description: string;      // Description of the style
  genre: string[];          // Genres associated with this style
  project_id: string;       // Associated project
  comparable_authors: string[]; // Similar authors
  user_comments: string;    // Additional notes
  created_at: string;       // Timestamp of creation
  updated_at: string;       // Timestamp of last update
  user_id: string;          // Owner of the profile
}

/**
 * sample_analyses table
 * 
 * Contains detailed analysis of writing samples.
 */
export interface SampleAnalysis {
  id: string;               // UUID primary key
  sample_id: string;        // Foreign key to writing_samples
  analysis_data: any;       // JSON data with analysis results
  created_at: string;       // Timestamp of creation
  updated_at: string;       // Timestamp of last update
}

/**
 * profile_samples table
 * 
 * Junction table linking style profiles to their constituent samples.
 */
export interface ProfileSample {
  profile_id: string;       // Foreign key to style_profiles
  sample_id: string;        // Foreign key to writing_samples
  created_at: string;       // Timestamp of creation
}

/**
 * representative_samples table
 * 
 * Examples that best exemplify a particular style profile.
 */
export interface RepresentativeSample {
  id: string;               // UUID primary key
  profile_id: string;       // Foreign key to style_profiles
  text_content: string;     // The exemplary text
  description: string;      // Description of what makes it representative
  created_at: string;       // Timestamp of creation
}

/**
 * users table
 * 
 * User accounts (managed by Supabase Auth).
 */
export interface User {
  id: string;               // UUID primary key (from Supabase Auth)
  email: string;            // User's email
  display_name: string;     // User's display name
  created_at: string;       // Timestamp of creation
}
