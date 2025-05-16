// handlers/import-handlers.js
import { import_analyzed_story } from '../import_analyzed_story.js';

export default {
  /**
   * Handler for import_analyzed_story tool
   * Takes pre-analyzed story data and imports it into the database
   */
  async importAnalyzedStory(args) {
    try {
      console.log('Handling import_analyzed_story request');
      
      // Extract data from args
      const { data } = args;
      
      if (!data) {
        return {
          content: [
            { type: 'text', text: 'Error: Missing data parameter' }
          ],
          isError: true
        };
      }
      
      // Call the implementation function
      const result = await import_analyzed_story(data);
      
      if (!result.success) {
        return {
          content: [
            { type: 'text', text: `Error importing story data: ${result.error}` }
          ],
          isError: true
        };
      }
      
      // Format successful result for display
      return {
        content: [
          { 
            type: 'text', 
            text: `Successfully imported analyzed story data!\n\nEntities processed:\n- Story World: ${result.counts.storyWorld}\n- Story: ${result.counts.story}\n- Characters: ${result.counts.characters}\n- Locations: ${result.counts.locations}\n- Factions: ${result.counts.factions}\n- Objects: ${result.counts.objects}\n- Events: ${result.counts.events}\n- Character Relationships: ${result.counts.relationships}\n- Plotlines: ${result.counts.plotlines}\n- Scenes: ${result.counts.scenes}`
          }
        ]
      };
    } catch (error) {
      console.error('Error in importAnalyzedStory handler:', error);
      return {
        content: [
          { type: 'text', text: `Error: ${error.message}` }
        ],
        isError: true
      };
    }
  }
};
