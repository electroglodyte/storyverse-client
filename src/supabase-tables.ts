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

/**
 * TIMELINE AND STORY STRUCTURE TABLES
 * These tables are used for managing storylines, scenes, events, and the timeline
 */

/**
 * characters table
 * 
 * Characters in story worlds.
 */
export interface Character {
  id: string;               // UUID primary key
  name: string;             // Character name
  role: string;             // protagonist, antagonist, supporting, etc.
  description: string;      // Character description
  attributes: any;          // JSON with flexible character traits
  relationships: any;       // JSON array of relationships to other characters
  story_id?: string;        // Legacy field - being replaced by story_world_id
  storyworld_id: string;    // Alias for story_world_id
  story_world_id: string;   // Foreign key to story_worlds
  created_at: string;       // Timestamp of creation
  updated_at: string;       // Timestamp of last update
  user_id?: string;         // Owner of the character
}

/**
 * locations table (formerly settings)
 * 
 * Locations/places in story worlds.
 */
export interface Location {
  id: string;               // UUID primary key
  name: string;             // Location name
  location_type: string;    // interior, exterior, virtual, etc.
  time_period: string;      // Optional time period descriptor
  description: string;      // Location description
  attributes: any;          // JSON with flexible location properties
  parent_location_id: string; // Foreign key for nested locations
  story_id?: string;        // Legacy field - being replaced by story_world_id
  storyworld_id: string;    // Alias for story_world_id
  story_world_id: string;   // Foreign key to story_worlds
  created_at: string;       // Timestamp of creation
  updated_at: string;       // Timestamp of last update
  user_id?: string;         // Owner of the location
}

/**
 * factions table
 * 
 * Groups of characters with shared allegiances, goals, or connections.
 */
export interface Faction {
  id: string;               // UUID primary key
  name: string;             // Faction name
  description: string;      // Faction description
  type: string;             // Type of faction (political, social, familial, etc.)
  attributes: any;          // JSON with flexible faction properties
  storyworld_id: string;    // Alias for story_world_id
  story_world_id: string;   // Foreign key to story_worlds
  created_at: string;       // Timestamp of creation
  updated_at: string;       // Timestamp of last update
  user_id: string;          // Owner of the faction
}

/**
 * faction_characters table
 * 
 * Junction table linking factions to characters.
 */
export interface FactionCharacter {
  id: string;               // UUID primary key
  faction_id: string;       // Foreign key to factions
  character_id: string;     // Foreign key to characters
  role: string;             // Character's role in the faction (leader, member, etc.)
  created_at: string;       // Timestamp of creation
}

/**
 * events table
 * 
 * Events that occur in the story world's chronology.
 */
export interface Event {
  id: string;               // UUID primary key
  title: string;            // Event title
  description: string;      // Event description
  chronological_time: string; // When the event happens in story world time
  relative_time_offset: string; // For stories without absolute dates
  time_reference_point: string; // Reference point for relative time
  sequence_number: number;  // For ordering events (adjustable)
  visible: boolean;         // Whether it's directly shown or just backstory
  story_id: string;         // Foreign key to stories
  created_at: string;       // Timestamp of creation
  updated_at: string;       // Timestamp of last update
}

/**
 * event_dependencies table
 * 
 * Tracks causal relationships and sequential dependencies between events.
 */
export interface EventDependency {
  id: string;               // UUID primary key
  predecessor_event_id: string; // Foreign key to events (the "before" event)
  successor_event_id: string;   // Foreign key to events (the "after" event)
  dependency_type: string;  // "causal", "prerequisite", "thematic", etc.
  strength: number;         // How rigid this relationship is (1-10)
  notes: string;            // Optional description of the relationship
  created_at: string;       // Timestamp of creation
  updated_at: string;       // Timestamp of last update
}

/**
 * character_events table
 * 
 * Junction table linking characters to events, forming their journey.
 */
export interface CharacterEvent {
  id: string;               // UUID primary key
  character_id: string;     // Foreign key to characters
  event_id: string;         // Foreign key to events
  importance: number;       // Significance of this event for this character (1-10)
  character_sequence_number: number; // Position in character's journey
  experience_type: string;  // How the character experiences this event (active, passive, off-screen)
  notes: string;            // Optional description of character's involvement
  created_at: string;       // Timestamp of creation
  updated_at: string;       // Timestamp of last update
}

/**
 * scenes table
 * 
 * Scenes that are shown in the story.
 */
export interface Scene {
  id: string;               // UUID primary key
  title: string;            // Scene title
  description: string;      // Scene description
  content: string;          // Scene content/text
  event_id: string;         // Foreign key to events
  story_id: string;         // Foreign key to stories
  created_at: string;       // Timestamp of creation
  updated_at: string;       // Timestamp of last update
}

/**
 * scene_characters table
 * 
 * Junction table linking scenes to characters.
 */
export interface SceneCharacter {
  id: string;               // UUID primary key
  scene_id: string;         // Foreign key to scenes
  character_id: string;     // Foreign key to characters
  importance: string;       // Character importance in scene (primary, secondary, etc.)
  created_at: string;       // Timestamp of creation
}

/**
 * scene_locations table (formerly scene_settings)
 * 
 * Junction table linking scenes to locations.
 */
export interface SceneLocation {
  id: string;               // UUID primary key
  scene_id: string;         // Foreign key to scenes
  location_id: string;      // Foreign key to locations
  created_at: string;       // Timestamp of creation
}

/**
 * storylines table
 * 
 * Storylines that track narrative threads throughout a story.
 */
export interface Storyline {
  id: string;               // UUID primary key
  title: string;            // Storyline title
  description: string;      // Storyline description
  color: string;            // Color for visual distinction in timeline
  story_id: string;         // Foreign key to stories
  created_at: string;       // Timestamp of creation
  updated_at: string;       // Timestamp of last update
}

/**
 * storyline_elements table
 * 
 * Junction table linking storylines to various elements.
 */
export interface StorylineElement {
  id: string;               // UUID primary key
  storyline_id: string;     // Foreign key to storylines
  element_type: string;     // Type of element (scene, event, etc.)
  element_id: string;       // ID of element (foreign key to different tables)
  created_at: string;       // Timestamp of creation
}

/**
 * structural_elements table
 * 
 * Structural elements like acts, beats, etc.
 */
export interface StructuralElement {
  id: string;               // UUID primary key
  title: string;            // Element title (Act 1, Midpoint, etc.)
  description: string;      // Element description
  type: string;             // Element type (act, beat, sequence, etc.)
  story_id: string;         // Foreign key to stories
  created_at: string;       // Timestamp of creation
  updated_at: string;       // Timestamp of last update
}

/**
 * timeline_elements table
 * 
 * Integrated timeline combining all element types.
 */
export interface TimelineElement {
  id: string;               // UUID primary key
  element_type: string;     // Type of element (scene, event, structural_element, etc.)
  element_id: string;       // ID of element (foreign key to different tables)
  chronological_time: string; // When the element occurs in chronological time
  relative_time_offset: string; // Time relative to a reference point
  time_reference_point: string; // Reference point for relative time
  story_order: number;      // Order in the narrative (may differ from chronological)
  story_id: string;         // Foreign key to stories
  created_at: string;       // Timestamp of creation
  updated_at: string;       // Timestamp of last update
}
