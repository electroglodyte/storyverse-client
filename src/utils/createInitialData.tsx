import { supabase } from '../supabaseClient';
import createDatabaseTablesSQL from './createDatabaseTables';

/**
 * One-time script to set up the database schema and create initial data
 */
async function createInitialData() {
  try {
    console.log('Starting database initialization...');
    
    // First, try to create the necessary tables
    console.log('Attempting to create database tables...');
    try {
      // Execute the raw SQL to create the tables
      const { data: createTablesData, error: createTablesError } = await supabase.rpc(
        'exec_sql',
        { sql: createDatabaseTablesSQL }
      );
      
      if (createTablesError) {
        // If the exec_sql function doesn't exist, we'll try another approach
        console.warn('Error executing SQL via RPC:', createTablesError);
        
        // Try alternate method with separate SQL statements
        console.log('Trying alternate method to create tables...');
        
        // Enable UUID extension first
        await supabase.rpc('create_uuid_extension', {});
        
        // Split the SQL script into separate statements and execute them one by one
        const statements = createDatabaseTablesSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);
        
        for (const stmt of statements) {
          const { error } = await supabase.rpc('execute_sql', { sql_statement: stmt });
          if (error) {
            console.warn(`Error executing statement: ${stmt}`, error);
          }
        }
      } else {
        console.log('Tables created successfully via RPC.');
      }
    } catch (tableCreateError) {
      console.warn('Error creating tables:', tableCreateError);
      // We'll continue anyway and see if we can add data to existing tables
    }
    
    // Check if Narnia already exists
    console.log('Checking for existing story worlds...');
    const { data: existingWorlds, error: checkError } = await supabase
      .from('story_worlds')
      .select('id, name');
    
    if (checkError) {
      console.error('Error checking story worlds:', checkError);
      
      if (checkError.code === '42P01') { // Table does not exist error
        return {
          success: false,
          message: 'Database tables do not exist. Please contact the administrator.',
          error: checkError
        };
      }
      
      throw checkError;
    }
    
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
        story_world_id: storyWorldId, // Include both versions of the field
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