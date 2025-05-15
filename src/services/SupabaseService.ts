import { supabase } from './supabase';

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
  name?: string;
  story_world_id: string;
  storyworld_id?: string;
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
  
  async createStory(storyData: Partial<Story>): Promise<Story | null> {
    console.log('Creating story with data:', storyData);
    
    // IMPORTANT: Do not include 'title' field as it's a generated column derived from 'name'
    // We remove it here to avoid the error "cannot insert a non-DEFAULT value into column 'title'"
    const { title, ...dataWithoutTitle } = storyData;
    
    // Ensure 'name' is set as it's required and 'title' is derived from it
    const storyToCreate = {
      ...dataWithoutTitle,
      name: storyData.name || title || '', // Use title as fallback for name if needed
      storyworld_id: storyData.story_world_id, // Add alias for compatibility
    };
    
    console.log('Prepared story data:', storyToCreate);
    
    try {
      const { data, error } = await supabase
        .from('stories')
        .insert([storyToCreate])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error creating story:', error);
        throw error;
      }
      
      console.log('Story created successfully:', data);
      return data;
    } catch (error) {
      console.error('Exception creating story:', error);
      throw error;
    }
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
    if (characters.length === 0) return [];
    
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
    if (locations.length === 0) return [];
    
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
    if (events.length === 0) return [];
    
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
    try {
      // Call the analyze-story edge function
      const { data, error } = await supabase.functions.invoke('analyze-story', {
        body: {
          story_text: fileContent,
          story_title: 'Story Analysis', // This will be replaced by the story title in the database
          options: {
            create_project: false, // We'll handle this ourselves
            extract_characters: true,
            extract_locations: true,
            extract_events: true,
            extract_relationships: true,
            interactive_mode: false
          }
        }
      });
      
      if (error) {
        console.error('Error calling analyze-story edge function:', error);
        throw error;
      }
      
      // Convert the returned data to our interface types
      const characters: Character[] = (data.characters || []).map((char: any) => ({
        id: crypto.randomUUID(),
        name: char.name,
        role: char.role || 'supporting',
        story_id: storyId,
        story_world_id: storyWorldId,
        description: char.description || '',
        created_at: new Date().toISOString()
      }));
      
      const locations: Location[] = (data.locations || []).map((loc: any) => ({
        id: crypto.randomUUID(),
        name: loc.name,
        location_type: loc.location_type || 'other',
        story_id: storyId,
        story_world_id: storyWorldId,
        description: loc.description || '',
        created_at: new Date().toISOString()
      }));
      
      const events: Event[] = (data.events || []).map((evt: any, index: number) => ({
        id: crypto.randomUUID(),
        title: evt.title,
        description: evt.description || '',
        story_id: storyId,
        sequence_number: evt.sequence_number || index + 1,
        created_at: new Date().toISOString()
      }));
      
      return { characters, locations, events };
    } catch (error) {
      console.error('Error in analyzeStory:', error);
      // Return empty arrays instead of crashing
      return {
        characters: [],
        locations: [],
        events: []
      };
    }
  },
  
  // Save Analysis Results
  async saveAnalysisResults(
    storyId: string,
    storyWorldId: string,
    characters: Character[],
    locations: Location[],
    events: Event[]
  ): Promise<boolean> {
    try {
      // Prepare data for insertion (remove IDs as they will be generated by the database)
      const charsToInsert = characters.map(({id, ...rest}) => ({
        ...rest,
        story_id: storyId,
        story_world_id: storyWorldId
      }));
      
      const locsToInsert = locations.map(({id, ...rest}) => ({
        ...rest,
        story_id: storyId,
        story_world_id: storyWorldId
      }));
      
      const evtsToInsert = events.map(({id, ...rest}) => ({
        ...rest,
        story_id: storyId
      }));
      
      // Insert data in parallel
      const [charResult, locResult, evtResult] = await Promise.all([
        charsToInsert.length > 0 ? this.createCharacters(charsToInsert) : Promise.resolve([]),
        locsToInsert.length > 0 ? this.createLocations(locsToInsert) : Promise.resolve([]),
        evtsToInsert.length > 0 ? this.createEvents(evtsToInsert) : Promise.resolve([])
      ]);
      
      console.log('Saved analysis results:', {
        characters: charResult.length,
        locations: locResult.length,
        events: evtResult.length
      });
      
      return true;
    } catch (error) {
      console.error('Error saving analysis results:', error);
      return false;
    }
  }
};
