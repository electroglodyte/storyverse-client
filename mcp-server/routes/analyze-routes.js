// mcp-server/routes/analyze-routes.js
import express from 'express';
import narrativeHandlers from '../handlers/narrative-handlers.js';

const router = express.Router();

// Endpoint for story analysis
router.post('/analyze-story', async (req, res) => {
  try {
    const { story_text, story_title, options } = req.body;
    
    if (!story_text || !story_title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters: story_text and story_title are required' 
      });
    }
    
    // Call the analyze_story handler
    const result = await narrativeHandlers.analyzeStory({
      story_text,
      story_title,
      options
    });
    
    return res.json(result);
  } catch (error) {
    console.error('Error analyzing story:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error analyzing story: ${error.message}` 
    });
  }
});

export default router;