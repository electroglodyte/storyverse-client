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
  appearance?: string;
  personality?: string;
  background?: string;
  motivation?: string;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  story_id: string;
  story_world_id?: string;
  description?: string;
  location_type?: string;
  parent_location_id?: string;
  notable_features?: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  story_id: string;
  description?: string;
  sequence_number?: number;
  chronological_time?: string;
  relative_time_offset?: string;
  created_at: string;
}

export interface Scene {
  id: string;
  title: string;
  story_id: string;
  description?: string;
  content?: string;
  sequence_number?: number;
  type?: string;
  status?: string;
  event_id?: string;
  created_at?: string;
}

export interface Plotline {
  id: string;
  title: string;
  story_id: string;
  description?: string;
  plotline_type?: string;
  starting_event_id?: string;
  climax_event_id?: string;
  resolution_event_id?: string;
  created_at?: string;
}

export interface CharacterRelationship {
  id: string;
  character1_id: string;
  character2_id: string;
  character1_name?: string;
  character2_name?: string;
  relationship_type: string;
  description?: string;
  intensity?: number;
  story_id?: string;
  created_at?: string;
}

export interface EventDependency {
  id: string;
  predecessor_event_id: string;
  successor_event_id: string;
  dependency_type: string;
  strength?: number;
  notes?: string;
  created_at?: string;
}

export interface CharacterArc {
  id: string;
  character_id: string;
  character_name?: string;
  story_id: string;
  title: string;
  description?: string;
  starting_state?: string;
  ending_state?: string;
  catalyst?: string;
  created_at?: string;
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
  
  // Scenes
  async getScenes(storyId: string): Promise<Scene[]> {
    const { data, error } = await supabase
      .from('scenes')
      .select('*')
      .eq('story_id', storyId)
      .order('sequence_number');
    
    if (error) {
      console.error('Error fetching scenes:', error);
      return [];
    }
    
    return data || [];
  },
  
  async createScenes(scenes: Array<Omit<Scene, 'id' | 'created_at'>>): Promise<Scene[]> {
    if (scenes.length === 0) return [];
    
    const { data, error } = await supabase
      .from('scenes')
      .insert(scenes)
      .select();
    
    if (error) {
      console.error('Error creating scenes:', error);
      return [];
    }
    
    return data || [];
  },
  
  // Plotlines
  async getPlotlines(storyId: string): Promise<Plotline[]> {
    const { data, error } = await supabase
      .from('plotlines')
      .select('*')
      .eq('story_id', storyId)
      .order('title');
    
    if (error) {
      console.error('Error fetching plotlines:', error);
      return [];
    }
    
    return data || [];
  },
  
  async createPlotlines(plotlines: Array<Omit<Plotline, 'id' | 'created_at'>>): Promise<Plotline[]> {
    if (plotlines.length === 0) return [];
    
    const { data, error } = await supabase
      .from('plotlines')
      .insert(plotlines)
      .select();
    
    if (error) {
      console.error('Error creating plotlines:', error);
      return [];
    }
    
    return data || [];
  },
  
  // Character Relationships
  async getCharacterRelationships(storyId: string): Promise<CharacterRelationship[]> {
    const { data, error } = await supabase
      .from('character_relationships')
      .select('*')
      .eq('story_id', storyId);
    
    if (error) {
      console.error('Error fetching character relationships:', error);
      return [];
    }
    
    return data || [];
  },
  
  async createCharacterRelationships(relationships: Array<Omit<CharacterRelationship, 'id' | 'created_at'>>): Promise<CharacterRelationship[]> {
    if (relationships.length === 0) return [];
    
    const { data, error } = await supabase
      .from('character_relationships')
      .insert(relationships)
      .select();
    
    if (error) {
      console.error('Error creating character relationships:', error);
      return [];
    }
    
    return data || [];
  },
  
  // Event Dependencies
  async getEventDependencies(storyId: string): Promise<EventDependency[]> {
    // We need to join with events to filter by story_id
    const { data, error } = await supabase
      .from('event_dependencies')
      .select('*, predecessor:predecessor_event_id(story_id)')
      .eq('predecessor.story_id', storyId);
    
    if (error) {
      console.error('Error fetching event dependencies:', error);
      return [];
    }
    
    // Clean up the response to match the interface
    return (data || []).map(({ predecessor, ...rest }) => rest);
  },
  
  async createEventDependencies(dependencies: Array<Omit<EventDependency, 'id' | 'created_at'>>): Promise<EventDependency[]> {
    if (dependencies.length === 0) return [];
    
    const { data, error } = await supabase
      .from('event_dependencies')
      .insert(dependencies)
      .select();
    
    if (error) {
      console.error('Error creating event dependencies:', error);
      return [];
    }
    
    return data || [];
  },
  
  // Character Arcs
  async getCharacterArcs(storyId: string): Promise<CharacterArc[]> {
    const { data, error } = await supabase
      .from('character_arcs')
      .select('*')
      .eq('story_id', storyId);
    
    if (error) {
      console.error('Error fetching character arcs:', error);
      return [];
    }
    
    return data || [];
  },
  
  async createCharacterArcs(arcs: Array<Omit<CharacterArc, 'id' | 'created_at'>>): Promise<CharacterArc[]> {
    if (arcs.length === 0) return [];
    
    const { data, error } = await supabase
      .from('character_arcs')
      .insert(arcs)
      .select();
    
    if (error) {
      console.error('Error creating character arcs:', error);
      return [];
    }
    
    return data || [];
  },
  
  // Story Analysis
  async analyzeStory(storyId: string, storyWorldId: string, fileContent: string): Promise<{
    characters: Character[];
    locations: Location[];
    events: Event[];
    scenes: Scene[];
    plotlines: Plotline[];
    characterRelationships: CharacterRelationship[];
    eventDependencies: EventDependency[];
    characterArcs: CharacterArc[];
  }> {
    try {
      // Call the enhanced analyze-story edge function
      const { data, error } = await supabase.functions.invoke('analyze-story', {
        body: {
          story_text: fileContent,
          story_title: 'Story Analysis', // This will be replaced by the story title in the database
          story_world_id: storyWorldId,
          options: {
            create_project: false, // We'll handle this ourselves
            story_id: storyId,
            extract_characters: true,
            extract_locations: true,
            extract_events: true,
            extract_scenes: true,
            extract_plotlines: true,
            extract_relationships: true,
            extract_dependencies: true,
            extract_arcs: true,
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
        appearance: char.appearance || '',
        personality: char.personality || '',
        background: char.background || '',
        motivation: char.motivation || '',
        created_at: new Date().toISOString()
      }));
      
      const locations: Location[] = (data.locations || []).map((loc: any) => ({
        id: crypto.randomUUID(),
        name: loc.name,
        location_type: loc.location_type || 'other',
        story_id: storyId,
        story_world_id: storyWorldId,
        description: loc.description || '',
        notable_features: loc.notable_features || '',
        created_at: new Date().toISOString()
      }));
      
      const events: Event[] = (data.events || []).map((evt: any, index: number) => ({
        id: crypto.randomUUID(),
        title: evt.title,
        description: evt.description || '',
        story_id: storyId,
        sequence_number: evt.sequence_number || index + 1,
        chronological_time: evt.chronological_time || '',
        relative_time_offset: evt.relative_time_offset || '',
        created_at: new Date().toISOString()
      }));
      
      const scenes: Scene[] = (data.scenes || []).map((scene: any, index: number) => ({
        id: crypto.randomUUID(),
        title: scene.title,
        description: scene.description || '',
        content: scene.content || '',
        story_id: storyId,
        sequence_number: scene.sequence_number || index + 1,
        type: scene.type || 'scene',
        status: scene.status || 'finished'
      }));
      
      const plotlines: Plotline[] = (data.plotlines || []).map((plot: any) => ({
        id: crypto.randomUUID(),
        title: plot.title,
        description: plot.description || '',
        plotline_type: plot.plotline_type || 'main',
        story_id: storyId
      }));
      
      // Character relationship handling requires character IDs to be mapped
      const characterNameToId = characters.reduce((map, char) => {
        map[char.name] = char.id;
        return map;
      }, {} as Record<string, string>);
      
      const characterRelationships: CharacterRelationship[] = (data.characterRelationships || [])
        .filter((rel: any) => rel.character1_name && rel.character2_name && 
                characterNameToId[rel.character1_name] && characterNameToId[rel.character2_name])
        .map((rel: any) => ({
          id: crypto.randomUUID(),
          character1_id: characterNameToId[rel.character1_name],
          character2_id: characterNameToId[rel.character2_name],
          relationship_type: rel.relationship_type || 'other',
          description: rel.description || '',
          intensity: rel.intensity || 5,
          story_id: storyId
        }));
      
      // Event dependency handling requires event IDs to be mapped
      const eventSequenceToId = events.reduce((map, evt) => {
        if (evt.sequence_number !== undefined) {
          map[evt.sequence_number] = evt.id;
        }
        return map;
      }, {} as Record<number, string>);
      
      const eventDependencies: EventDependency[] = (data.eventDependencies || [])
        .filter((dep: any) => dep.predecessor_sequence && dep.successor_sequence && 
                eventSequenceToId[dep.predecessor_sequence] && eventSequenceToId[dep.successor_sequence])
        .map((dep: any) => ({
          id: crypto.randomUUID(),
          predecessor_event_id: eventSequenceToId[dep.predecessor_sequence],
          successor_event_id: eventSequenceToId[dep.successor_sequence],
          dependency_type: dep.dependency_type || 'chronological',
          strength: dep.strength || 5,
          notes: dep.description || ''
        }));
      
      // Character arc handling requires character IDs to be mapped
      const characterArcs: CharacterArc[] = (data.characterArcs || [])
        .filter((arc: any) => arc.character_name && characterNameToId[arc.character_name])
        .map((arc: any) => ({
          id: crypto.randomUUID(),
          character_id: characterNameToId[arc.character_name],
          story_id: storyId,
          title: arc.title || `${arc.character_name}'s Arc`,
          description: arc.description || '',
          starting_state: arc.starting_state || '',
          ending_state: arc.ending_state || ''
        }));
      
      return { 
        characters, 
        locations, 
        events, 
        scenes, 
        plotlines, 
        characterRelationships,
        eventDependencies,
        characterArcs
      };
    } catch (error) {
      console.error('Error in analyzeStory:', error);
      // Return empty arrays instead of crashing
      return {
        characters: [],
        locations: [],
        events: [],
        scenes: [],
        plotlines: [],
        characterRelationships: [],
        eventDependencies: [],
        characterArcs: []
      };
    }
  },
  
  // Save Analysis Results
  async saveAnalysisResults(
    storyId: string,
    storyWorldId: string,
    characters: Character[],
    locations: Location[],
    events: Event[],
    scenes?: Scene[],
    plotlines?: Plotline[],
    characterRelationships?: CharacterRelationship[],
    eventDependencies?: EventDependency[],
    characterArcs?: CharacterArc[]
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
      
      // Handle optional data types
      const scenesToInsert = scenes?.map(({id, ...rest}) => ({
        ...rest,
        story_id: storyId
      })) || [];
      
      const plotlinesToInsert = plotlines?.map(({id, ...rest}) => ({
        ...rest,
        story_id: storyId
      })) || [];
      
      const relationshipsToInsert = characterRelationships?.map(({id, ...rest}) => ({
        ...rest,
        story_id: storyId
      })) || [];
      
      const dependenciesToInsert = eventDependencies?.map(({id, ...rest}) => rest) || [];
      
      const arcsToInsert = characterArcs?.map(({id, ...rest}) => ({
        ...rest,
        story_id: storyId
      })) || [];
      
      // Insert data in parallel
      const results = await Promise.allSettled([
        charsToInsert.length > 0 ? this.createCharacters(charsToInsert) : Promise.resolve([]),
        locsToInsert.length > 0 ? this.createLocations(locsToInsert) : Promise.resolve([]),
        evtsToInsert.length > 0 ? this.createEvents(evtsToInsert) : Promise.resolve([]),
        scenesToInsert.length > 0 ? this.createScenes(scenesToInsert) : Promise.resolve([]),
        plotlinesToInsert.length > 0 ? this.createPlotlines(plotlinesToInsert) : Promise.resolve([]),
        relationshipsToInsert.length > 0 ? this.createCharacterRelationships(relationshipsToInsert) : Promise.resolve([]),
        dependenciesToInsert.length > 0 ? this.createEventDependencies(dependenciesToInsert) : Promise.resolve([]),
        arcsToInsert.length > 0 ? this.createCharacterArcs(arcsToInsert) : Promise.resolve([])
      ]);
      
      // Check for failures
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn('Some data failed to save:', failures);
      }
      
      // Log success
      console.log('Saved analysis results:', {
        characters: charsToInsert.length,
        locations: locsToInsert.length,
        events: evtsToInsert.length,
        scenes: scenesToInsert.length,
        plotlines: plotlinesToInsert.length,
        relationships: relationshipsToInsert.length,
        dependencies: dependenciesToInsert.length,
        arcs: arcsToInsert.length
      });
      
      return failures.length === 0;
    } catch (error) {
      console.error('Error saving analysis results:', error);
      return false;
    }
  }
};
