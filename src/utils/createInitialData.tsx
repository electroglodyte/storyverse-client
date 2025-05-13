import { supabase } from '../supabaseClient';

/**
 * One-time script to create initial data in Supabase
 * Run this script manually when needed
 */
async function createInitialData() {
  try {
    console.log('Creating Narnia story world...');
    
    // First, check if Narnia already exists
    const { data: existingWorlds, error: checkError } = await supabase
      .from('story_worlds')
      .select('id, name')
      .eq('name', 'Narnia');
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingWorlds && existingWorlds.length > 0) {
      console.log('Narnia story world already exists!', existingWorlds);
      return existingWorlds[0];
    }
    
    // Create a new Narnia story world - use supabase's built-in UUID generation
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
      throw error;
    }
    
    console.log('Successfully created Narnia story world:', data);
    return data;
  } catch (error) {
    console.error('Error creating initial data:', error);
    return null;
  }
}

// Export the function for use elsewhere
export default createInitialData;

// Self-execute if this file is run directly
if (typeof window !== 'undefined') {
  const executeButton = document.createElement('button');
  executeButton.innerText = 'Create Initial Data';
  executeButton.style.padding = '10px 20px';
  executeButton.style.margin = '20px';
  executeButton.style.backgroundColor = '#a38671';
  executeButton.style.color = 'white';
  executeButton.style.border = 'none';
  executeButton.style.borderRadius = '4px';
  executeButton.style.cursor = 'pointer';
  
  executeButton.onclick = async () => {
    const result = await createInitialData();
    alert(result ? 'Data created successfully!' : 'Error creating data. Check console.');
  };
  
  document.body.appendChild(executeButton);
}