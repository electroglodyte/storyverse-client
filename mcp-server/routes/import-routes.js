// mcp-server/routes/import-routes.js
import express from 'express';
import importHandlers from '../handlers/import-handlers.js';

const router = express.Router();

// Endpoint for story import with full analysis and storage
router.post('/import-story', async (req, res) => {
  try {
    const { story_text, story_title, options } = req.body;
    
    if (!story_text || !story_title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters: story_text and story_title are required' 
      });
    }
    
    // Call the import handler
    const result = await importHandlers.importStory({
      story_text,
      story_title,
      options
    });
    
    return res.json(result);
  } catch (error) {
    console.error('Error importing story:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error importing story: ${error.message}` 
    });
  }
});

// Endpoint for extracting story elements without saving
router.post('/extract-story-elements', async (req, res) => {
  try {
    const { story_text, options } = req.body;
    
    if (!story_text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameter: story_text is required' 
      });
    }
    
    // Call the extract elements handler
    const result = await importHandlers.extractStoryElements({
      story_text,
      options
    });
    
    return res.json(result);
  } catch (error) {
    console.error('Error extracting story elements:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error extracting story elements: ${error.message}` 
    });
  }
});

// Endpoint for importing with progress updates
router.post('/import-story-with-progress', async (req, res) => {
  try {
    const { story_text, story_title, options } = req.body;
    
    if (!story_text || !story_title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters: story_text and story_title are required' 
      });
    }
    
    // Call the import with progress handler
    const result = await importHandlers.importStoryWithProgress({
      story_text,
      story_title,
      options
    });
    
    return res.json(result);
  } catch (error) {
    console.error('Error importing story with progress:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error importing story with progress: ${error.message}` 
    });
  }
});

export default router;