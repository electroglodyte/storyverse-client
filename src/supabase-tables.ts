/**
 * StoryVerse Database Schema
 * Version: 0.4.4
 * 
 * This file contains TypeScript types for all tables in the Supabase database.
 */

// Story World - top level container for stories, characters, etc.
export interface StoryWorld {
  id: string;
  name: string;
  description?: string;
  genre?: string[];
  tags?: string[];
  time_period?: string;
  rules?: string;
  image_url?: string;
  cover_image?: string; // Added to support both naming conventions
  notes?: string;
  attributes?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

// Series - a collection of related stories
export interface Series {
  id: string;
  name: string;
  description?: string;
  story_world_id?: string;
  storyworld_id?: string; // Alias for story_world_id
  tags?: string[];
  status?: 'planned' | 'in-progress' | 'completed' | 'on-hold';
  target_length?: number;
  sequence_type?: string;
  image_url?: string;
  notes?: string;
  attributes?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

// Story - a narrative entity containing characters, events, etc.
export interface Story {
  id: string;
  title: string;
  name: string; // Duplicate of title for backward compatibility
  description?: string;
  story_world_id?: string;
  storyworld_id?: string; // Alias for story_world_id
  series_id?: string;
  series_order?: number;
  status?: string;
  story_type?: 'novel' | 'short_story' | 'screenplay' | 'episode' | 'other';
  word_count?: number;
  word_count_target?: number;
  target_date?: string;
  synopsis?: string;
  image_url?: string;
  notes?: string;
  tags?: string[];
  genre?: string[];
  attributes?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

// Extended Story interface with additional properties
export interface ExtendedStory extends Story {
  // Add all properties that are used in the code
  storyworld_id: string;    // Alias for story_world_id
  story_world_id: string;   // Foreign key to story_worlds
  tags?: string[];          // Tags for categorization
  genre?: string[];         // Genres for the story
}

// Character - a person or entity in a story
export interface Character {
  id: string;
  name: string;
  description?: string;
  story_world_id?: string;
  storyworld_id?: string; // Alias for story_world_id
  story_id?: string;
  role?: 'protagonist' | 'antagonist' | 'supporting' | 'background' | 'other';
  appearance?: string;
  background?: string;
  motivation?: string;
  personality?: string;
  age?: string;
  faction_id?: string;
  location_id?: string;
  image_url?: string;
  notes?: string;
  attributes?: Record<string, any>;
  relationships?: any;      // JSON array of relationships to other characters
  created_at: string;
  updated_at: string;
  user_id?: string;
}

// Location - a place in the story world
export interface Location {
  id: string;
  name: string;
  description?: string;
  story_world_id?: string;
  storyworld_id?: string; // Alias for story_world_id
  story_id?: string;
  location_type?: 'city' | 'building' | 'natural' | 'country' | 'planet' | 'realm' | 'other';
  parent_location_id?: string;
  time_period?: string;
  climate?: string;
  culture?: string;
  map_coordinates?: string;
  notable_features?: string;
  image_url?: string;
  notes?: string;
  attributes?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

// Faction - a group or organization in the story world
export interface Faction {
  id: string;
  name: string;
  description?: string;
  story_world_id?: string;
  storyworld_id?: string; // Alias for story_world_id
  story_id?: string;
  type?: string; // For backward compatibility
  faction_type?: 'government' | 'organization' | 'family' | 'species' | 'religion' | 'other';
  leader_character_id?: string;
  headquarters_location_id?: string;
  ideology?: string;
  goals?: string;
  resources?: string;
  image_url?: string;
  notes?: string;
  attributes?: Record<string, any>;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

// Object - a prop or item in the story
export interface Object {
  id: string;
  name: string;
  description?: string;
  significance?: string;
  current_location?: string;
  current_owner?: string;
  properties?: string;
  history?: string;
  appearance_count?: number;
  is_macguffin?: boolean;
  object_type?: string;  // weapon, tool, clothing, magical, technology, document, etc.
  story_world_id?: string;
  storyworld_id?: string; // Alias for story_world_id
  story_id?: string;
  project_id?: string;    // Alias for story_world_id
  tags?: string[];
  media_urls?: string[];
  notes?: string;
  created_at: string;
  user_id?: string;
}

// Object-Character Relationship - links objects to characters
export interface ObjectCharacterRelationship {
  id: string;
  object_id: string;
  character_id: string;
  relationship_type?: string; // owned, created, desires, etc.
  description?: string;
  created_at: string;
}

// Object-Location Relationship - links objects to locations
export interface ObjectLocationRelationship {
  id: string;
  object_id: string;
  location_id: string;
  relationship_type?: string; // stored, hidden, connected to, etc.
  description?: string;
  created_at: string;
}

// Object Appearance - tracks where/when objects appear
export interface ObjectAppearance {
  id: string;
  object_id: string;
  scene_id?: string;
  event_id?: string;
  importance?: string; // primary, secondary, background
  description?: string;
  created_at: string;
}

// Character Relationship - connection between two characters
export interface CharacterRelationship {
  id: string;
  character1_id: string;
  character2_id: string;
  relationship_type: 'family' | 'friend' | 'ally' | 'enemy' | 'romantic' | 'professional' | 'other';
  description?: string;
  intensity?: number; // 1-10
  story_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Item - significant objects in the story world
export interface Item {
  id: string;
  name: string;
  description?: string;
  story_world_id?: string;
  story_id?: string;
  item_type?: 'weapon' | 'tool' | 'clothing' | 'magical' | 'technology' | 'document' | 'other';
  owner_character_id?: string;
  location_id?: string;
  properties?: string;
  significance?: string;
  image_url?: string;
  notes?: string;
  attributes?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Event - a significant occurrence in a story
export interface Event {
  id: string;
  title: string;
  description?: string;
  story_id: string;
  sequence_number: number;
  chronological_time?: string;
  relative_time_offset?: string;
  time_reference_point?: string;
  visible?: boolean;
  created_at: string;
  updated_at: string;
}

// Character Event - links a character to an event
export interface CharacterEvent {
  id: string;
  character_id: string;
  event_id: string;
  importance: number; // 1-10
  character_sequence_number: number;
  experience_type?: 'active' | 'passive' | 'off-screen';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// Character Arc - development trajectory for a character
export interface CharacterArc {
  id: string;
  character_id: string;
  story_id: string;
  title: string;
  description?: string;
  starting_state?: string;
  ending_state?: string;
  catalyst?: string;
  challenges?: string[];
  key_events?: string[];
  theme?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Plotline - a narrative thread within a story
export interface Plotline {
  id: string;
  title: string;
  description?: string;
  story_id: string;
  plotline_type?: 'main' | 'subplot' | 'character' | 'thematic' | 'other';
  starting_event_id?: string;
  climax_event_id?: string;
  resolution_event_id?: string;
  theme?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Arc Events - links arc to events
export interface ArcEvent {
  id: string;
  arc_id: string;
  event_id: string;
  arc_type: string;
  created_at: string;
}

// Plotline Events - links plotlines to events
export interface PlotlineEvent {
  id: string;
  plotline_id: string;
  event_id: string;
  created_at: string;
}

// Plotline Characters - links plotlines to characters
export interface PlotlineCharacter {
  id: string;
  plotline_id: string;
  character_id: string;
  created_at: string;
}

// Scene Type enum
export enum SceneType {
  BEAT = 'beat',
  OUTLINE = 'outline',
  SCENE = 'scene',
  CHAPTER = 'chapter',
  OUTLINE_ELEMENT = 'outline_element',
  SUMMARY = 'summary'
}

// Scene Status enum
export enum SceneStatus {
  IDEA = 'idea',
  DRAFT = 'draft', 
  REVISED = 'revised',
  POLISHED = 'polished',
  FINISHED = 'finished'
}

// Scene - a specific moment within a story, linked to an event
export interface Scene {
  id: string;
  title: string;
  description?: string;
  content?: string;
  event_id?: string;
  story_id?: string;
  sequence_number?: number;
  is_visible?: boolean;
  type: SceneType;
  status: SceneStatus;
  format?: 'plain' | 'fountain' | 'markdown';
  metadata?: Record<string, any>;
  essence?: string;  // A very simple description of what happens in the scene
  interest?: string; // Where the audience interest will lie in the scene
  created_at: string;
  updated_at: string;
}

// Scene Version - tracked history of scene changes
export interface SceneVersion {
  id: string;
  scene_id: string;
  content: string;
  version_number: number;
  created_at: string;
  created_by?: string;
  notes?: string;
}

// Scene Comment - feedback/annotations on scenes
export interface SceneComment {
  id: string;
  scene_id: string;
  content: string;
  created_at: string;
  created_by?: string;
  resolved?: boolean;
  position?: Record<string, any>; // JSONB for position in text
  type?: 'revision' | 'suggestion' | 'question' | 'comment';
}

// Scene Character - links a character to a scene
export interface SceneCharacter {
  id: string;
  scene_id: string;
  character_id: string;
  importance: 'primary' | 'secondary' | 'background';
  created_at: string;
}

// Scene Location - links a location to a scene
export interface SceneLocation {
  id: string;
  scene_id: string;
  location_id: string;
  created_at: string;
}

// Story Question - tracks narrative questions and their resolution
export interface StoryQuestion {
  id: string;
  story_id: string;
  question: string;
  description?: string;
  origin_scene_id?: string;   // Where the question is first introduced
  resolution_scene_id?: string; // Where the question is resolved
  importance?: number;        // 1-10 scale of importance
  status?: 'open' | 'resolved' | 'abandoned'; // Current status
  category?: string;          // e.g., 'plot', 'character', 'mystery', 'thematic'
  target_audience?: boolean;  // Is this a question the audience is meant to track?
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Event Dependencies - connections between events
export interface EventDependency {
  id: string;
  predecessor_event_id: string;
  successor_event_id: string;
  dependency_type: 'causal' | 'prerequisite' | 'thematic' | 'chronological';
  strength: number; // 1-10
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// Faction Character - links a faction to a character
export interface FactionCharacter {
  id: string;
  faction_id: string;
  character_id: string;
  role: string;
  created_at: string;
}

// Writing Sample - text for style analysis
export interface WritingSample {
  id: string;
  title: string;
  text?: string;
  content?: string; // Alias for text
  excerpt?: string;
  author?: string;
  sample_type?: string;
  project_id?: string;
  tags?: string[];
  word_count?: number;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

// Style Analysis - analysis results for a writing sample
export interface StyleAnalysis {
  id: string;
  sample_id: string;
  sentence_metrics?: any;
  vocabulary_metrics?: any;
  narrative_characteristics?: any;
  stylistic_devices?: any;
  tone_attributes?: any;
  descriptive_summary?: string;
  comparable_authors?: string[];
  created_at: string;
  updated_at: string;
}

// Style Profile - a collection of style parameters
export interface StyleProfile {
  id: string;
  name: string;
  description?: string;
  style_parameters: Record<string, any>;
  project_id?: string;
  genre?: string[];
  comparable_authors?: string[];
  user_comments?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

// Profile Sample - links a style profile to a writing sample
export interface ProfileSample {
  profile_id: string;
  sample_id: string;
  weight?: number;
  created_at: string;
}

// Representative Sample - an exemplary passage for a style profile
export interface RepresentativeSample {
  id: string;
  profile_id: string;
  text_content: string;
  description?: string;
  created_at: string;
}

// User - a registered account 
export interface User {
  id: string;
  email: string;
  display_name?: string;
  created_at: string;
}

// Storyline - for backward compatibility
export interface Storyline {
  id: string;
  title: string;
  description: string;
  color: string;
  story_id: string;
  created_at: string;
  updated_at: string;
}

// Storyline Element - for backward compatibility
export interface StorylineElement {
  id: string;
  storyline_id: string;
  element_type: string;
  element_id: string;
  created_at: string;
}

// Structural Element - for backward compatibility
export interface StructuralElement {
  id: string;
  title: string;
  description: string;
  type: string;
  story_id: string;
  created_at: string;
  updated_at: string;
}

// Timeline Element - for backward compatibility
export interface TimelineElement {
  id: string;
  element_type: string;
  element_id: string;
  chronological_time: string;
  relative_time_offset: string;
  time_reference_point: string;
  story_order: number;
  story_id: string;
  created_at: string;
  updated_at: string;
}