import { supabase } from '../supabaseClient';

/**
 * Script to clear all characters from NoneVerse storyworld
 */
export const clearNoneVerseCharacters = async () => {
  try {
    // NoneVerse storyworld ID
    const NONEVERSE_ID = 'bb4e4c55-0280-4ba1-985b-1590e3270d65';
    
    // Step 1: Fetch characters with story_world_id field
    const { data: charactersWithStoryWorldId, error: error1 } = await supabase
      .from('characters')
      .select('id, name')
      .eq('story_world_id', NONEVERSE_ID);
    
    if (error1) {
      console.error('Error fetching characters by story_world_id:', error1);
      return { success: false, error: error1.message };
    }
    
    // Step 2: Fetch characters with storyworld_id field (alternative field name)
    const { data: charactersWithStoryworldId, error: error2 } = await supabase
      .from('characters')
      .select('id, name')
      .eq('storyworld_id', NONEVERSE_ID);
    
    if (error2) {
      console.error('Error fetching characters by storyworld_id:', error2);
      return { success: false, error: error2.message };
    }
    
    // Combine both result sets, avoiding duplicates
    const allCharacters = [
      ...(charactersWithStoryWorldId || []),
      ...(charactersWithStoryworldId || [])
    ];
    
    // Get unique character IDs
    const uniqueCharacterIds = [...new Set(allCharacters.map(char => char.id))];
    
    if (uniqueCharacterIds.length === 0) {
      console.log('No characters found in NoneVerse storyworld');
      return { success: true, message: 'No characters found to delete', count: 0 };
    }
    
    // Step 3: Delete all characters
    const { data, error: deleteError } = await supabase
      .from('characters')
      .delete()
      .in('id', uniqueCharacterIds);
    
    if (deleteError) {
      console.error('Error deleting characters:', deleteError);
      return { success: false, error: deleteError.message };
    }
    
    console.log(`Successfully deleted ${uniqueCharacterIds.length} characters from NoneVerse`);
    return { 
      success: true, 
      message: `Successfully deleted ${uniqueCharacterIds.length} characters from NoneVerse`,
      count: uniqueCharacterIds.length
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

// Export a function that can be called directly from UI components
export const deleteNoneVerseCharacters = async () => {
  return await clearNoneVerseCharacters();
};
