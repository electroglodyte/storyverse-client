import { supabase } from '../supabaseClient';

/**
 * One-time script to set up the database schema and create initial data
 */
async function createInitialData() {
  try {
    console.log('Starting database initialization...');
    
    // First, check if necessary tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
      
    if (tablesError) {
      console.warn('Error checking existing tables:', tablesError);
      // Continue anyway as we may not have permission to query pg_tables
    } else {
      console.log('Existing tables:', tables);
    }
    
    // Check if Narnia already exists
    console.log('Checking for existing story worlds...');
    const { data: existingWorlds, error: checkError } = await supabase
      .from('story_worlds')
      .select('id, name');
    
    if (checkError) {
      console.error('Error checking story worlds:', checkError);
      
      if (checkError.code === '42P01') { // table does not exist
        console.log('Story worlds table does not exist. Attempting to create it...');
        
        // Create story_worlds table
        const createTableResult = await supabase.rpc('create_story_worlds_table', {});
        console.log('Create table result:', createTableResult);
      } else {
        throw checkError;
      }
    } else {
      console.log('Found existing story worlds:', existingWorlds);
      
      if (existingWorlds && existingWorlds.length > 0) {
        const narniaWorld = existingWorlds.find(world => world.name === 'Narnia');
        if (narniaWorld) {
          console.log('Narnia story world already exists!', narniaWorld);
          return {
            success: true,
            message: 'Narnia story world already exists',
            data: narniaWorld
          };
        }
      }
    }
    
    // Create a new Narnia story world
    console.log('Creating new Narnia story world...');
    const newStoryWorld = {
      name: 'Narnia',
      description: 'The magical world of Narnia created by C.S. Lewis',
      tags: ['fantasy', 'magic', 'children'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'system' // Replace with actual user_id when available
    };
    
    const { data, error } = await supabase
      .from('story_worlds')
      .insert([newStoryWorld])
      .select();
    
    if (error) {
      console.error('Error inserting story world:', error);
      throw error;
    }
    
    console.log('Successfully created Narnia story world:', data);
    
    // Also add a sample story for demonstration
    if (data && data.length > 0) {
      const storyWorldId = data[0].id;
      const sampleStory = {
        title: 'The Lion, the Witch and the Wardrobe',
        description: 'Four children are evacuated to a country house during the war where they find a magical wardrobe that leads to Narnia.',
        storyworld_id: storyWorldId,
        status: 'Complete',
        word_count: 36000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'system'
      };
      
      console.log('Adding sample story...');
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .insert([sampleStory])
        .select();
      
      if (storyError) {
        console.warn('Error adding sample story (non-critical):', storyError);
        // Continue anyway, as the story world creation was successful
      } else {
        console.log('Successfully added sample story:', storyData);
      }
    }
    
    return {
      success: true,
      message: 'Database initialized successfully',
      data
    };
  } catch (error) {
    console.error('Error creating initial data:', error);
    return {
      success: false,
      message: `Error: ${error.message || 'Unknown error'}`,
      error
    };
  }
}

// Export the function for use elsewhere
export default createInitialData;