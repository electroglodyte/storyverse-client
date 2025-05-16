// mcp-server/routes/import-routes.js
import express from 'express';
import importHandlers from '../handlers/import-handlers.js';

const router = express.Router();

// Endpoint for importing pre-analyzed story data
router.post('/import-analyzed-story', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameter: data is required' 
      });
    }
    
    // Call the import handler
    const result = await importHandlers.importAnalyzedStory({
      data
    });
    
    return res.json(result);
  } catch (error) {
    console.error('Error importing analyzed story:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error importing analyzed story: ${error.message}` 
    });
  }
});

export default router;