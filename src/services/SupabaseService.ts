import { supabase } from '../supabase';

export interface StoryWorld {
  id: string;
  name: string;
  description?: string;
  time_period?: string;
  created_at: string;
  updated_at?: string;
}

export interface Story {
  id: string;
  title: string;
  name?: string; // Added to match supabase-tables.ts for backward compatibility
  story_world_id: string;
  description?: string;
  synopsis?: string;
  status?: string;
  created_at: string;
  updated_at?: string;
}

export interface Character {
  id: string;
  name: string;
  story_id: string;
  story_world_id?: string;
  description?: string;
  role?: string;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  story_id: string;
  story_world_id?: string;
  description?: string;
  location_type?: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  story_id: string;
  description?: string;
  sequence_number?: number;
  created_at: string;
}

export const SupabaseService = {
  // Story Worlds
  async getStoryWorlds(): Promise<StoryWorld[]> {
    const { data, error } = await supabase
      .from('story_worlds')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching story worlds:', error);
      return [];
    }
    
    return data || [];
  },
  
  async createStoryWorld(storyWorld: Omit<StoryWorld, 'id' | 'created_at' | 'updated_at'>): Promise<StoryWorld | null> {
    const { data, error } = await supabase
      .from('story_worlds')
      .insert([storyWorld])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating story world:', error);
      return null;
    }
    
    return data;
  },
  
  // Stories
  async getStories(storyWorldId?: string): Promise<Story[]> {
    let query = supabase
      .from('stories')
      .select('*')
      .order('title');
    
    if (storyWorldId) {
      query = query.eq('story_world_id', storyWorldId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching stories:', error);
      return [];
    }
    
    return data || [];
  },
  
  async createStory(story: Omit<Story, 'id' | 'created_at' | 'updated_at'>): Promise<Story | null> {
    // Add name field if not provided (for backward compatibility)
    const storyWithName = { 
      ...story, 
      name: story.name || story.title // Use name if provided, otherwise use title
    };

    const { data, error } = await supabase
      .from('stories')
      .insert([storyWithName])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating story:', error);
      return null;
    }
    
    return data;
  },
  
  // Characters
  async getCharacters(storyId: string): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('story_id', storyId)
      .order('name');
    
    if (error) {
      console.error('Error fetching characters:', error);
      return [];
    }
    
    return data || [];
  },
  
  async createCharacters(characters: Array<Omit<Character, 'id' | 'created_at'>>): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .insert(characters)
      .select();
    
    if (error) {
      console.error('Error creating characters:', error);
      return [];
    }
    
    return data || [];
  },
  
  // Locations
  async getLocations(storyId: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('story_id', storyId)
      .order('name');
    
    if (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
    
    return data || [];
  },
  
  async createLocations(locations: Array<Omit<Location, 'id' | 'created_at'>>): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .insert(locations)
      .select();
    
    if (error) {
      console.error('Error creating locations:', error);
      return [];
    }
    
    return data || [];
  },
  
  // Events
  async getEvents(storyId: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('story_id', storyId)
      .order('sequence_number');
    
    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }
    
    return data || [];
  },
  
  async createEvents(events: Array<Omit<Event, 'id' | 'created_at'>>): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .insert(events)
      .select();
    
    if (error) {
      console.error('Error creating events:', error);
      return [];
    }
    
    return data || [];
  },
  
  // Story Analysis
  async analyzeStory(storyId: string, storyWorldId: string, fileContent: string): Promise<{
    characters: Character[];
    locations: Location[];
    events: Event[];
  }> {
    // In a real implementation, this would call the MCP tool for analysis
    // For now, we'll simulate the analysis with a timeout and some sample data
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate detection results
        const characters: Character[] = [
          {
            id: crypto.randomUUID(),
            name: 'Character 1',
            description: 'Detected from the story text',
            story_id: storyId,
            story_world_id: storyWorldId,
            created_at: new Date().toISOString()
          },
          {
            id: crypto.randomUUID(),
            name: 'Character 2',
            description: 'Detected from the story text',
            story_id: storyId,
            story_world_id: storyWorldId,
            created_at: new Date().toISOString()
          }
        ];
        
        const locations: Location[] = [
          {
            id: crypto.randomUUID(),
            name: 'Location 1',
            description: 'Detected from the story text',
            story_id: storyId,
            story_world_id: storyWorldId,
            created_at: new Date().toISOString()
          }
        ];
        
        const events: Event[] = [
          {
            id: crypto.randomUUID(),
            title: 'Event 1',
            description: 'Detected from the story text',
            story_id: storyId,
            sequence_number: 1,
            created_at: new Date().toISOString()
          },
          {
            id: crypto.randomUUID(),
            title: 'Event 2',
            description: 'Detected from the story text',
            story_id: storyId,
            sequence_number: 2,
            created_at: new Date().toISOString()
          }
        ];
        
        resolve({ characters, locations, events });
      }, 2000);
    });
  }
};