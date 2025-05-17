import { 
  StoryWorld, 
  Story, 
  Scene, 
  Character, 
  Location, 
  Event, 
  Series, 
  WritingSample,
  SceneComment,
  SceneVersion,
  StyleAnalysis,
  Faction,
  CharacterRelationship,
  CharacterEvent,
  Storyline,
  StructuralElement,
  Json
} from './database'

// Extended interfaces that include related data
export interface ExtendedStoryWorld extends StoryWorld {
  stories?: Story[]
  series?: Series[]
  characters?: Character[]
  locations?: Location[]
  events?: Event[]
  commentCount?: number
}

export interface ExtendedStory extends Story {
  storyworld?: StoryWorld
  series?: Series
  scenes?: Scene[]
  attributes: Json
  created_at: string
  description: string | null
  genre: string[] | null
  image_url: string | null
  name: string
  notes: string | null
  series_id: string | null
  story_world_id: string | null
  tags: string[] | null
  title: string
  type: string
  status: string
  word_count_target: number | null
}

export interface ExtendedScene extends Scene {
  story?: Story
  commentCount?: number
  comments?: SceneComment[]
  versions?: SceneVersion[]
}

export interface ProfileWithStyle {
  id: string
  name: string
  description: string | null
  weight: number
}

export interface ProfileSample {
  id: string
  title: string
  author: string | null
  sample_type: string | null
  word_count: number | null
  content: string | null
  excerpt: string | null
  weight: number
}

// For analyzing writing samples
export interface WritingSampleWithAnalysis extends WritingSample {
  style_analysis?: StyleAnalysis
  profile_samples?: ProfileSample[]
}

// For the timeline functionality
export interface TimelineElementWithDetails extends TimelineElement {
  element?: Scene | Event | StructuralElement
  storylines?: Storyline[]
}

// For character relationships
export interface CharacterWithRelationships extends Character {
  relationships?: CharacterRelationship[]
  events?: CharacterEvent[]
  faction?: Faction
}

// For faction members
export interface FactionWithMembers extends Faction {
  characters?: CharacterWithRelationships[]
  location?: Location
}

// For series with stories
export interface SeriesWithStories extends Series {
  stories?: Story[]
  storyworld?: StoryWorld
}

// For style profiles with samples
export interface StyleProfileWithSamples extends StyleProfile {
  samples?: WritingSample[]
  analyses?: StyleAnalysis[]
}