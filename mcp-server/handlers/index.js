// handlers/index.js
import styleHandlers from './style-handlers.js';
import narrativeHandlers from './narrative-handlers.js';
import entityHandlers from './entity-handlers.js';
import sceneHandlers from './scene-handlers.js';
import objectHandlers from './object-handlers.js';
import importHandlers from './import-handlers.js';

export default {
  ...styleHandlers,
  ...narrativeHandlers,
  ...entityHandlers,
  ...sceneHandlers,
  ...objectHandlers,
  
  // Map import tool names to handlers
  import_analyzed_story: importHandlers.importAnalyzedStory
};