// handlers/index.js
import styleHandlers from './style-handlers.js';
import narrativeHandlers from './narrative-handlers.js';
import entityHandlers from './entity-handlers.js';
import sceneHandlers from './scene-handlers.js';

export default {
  ...styleHandlers,
  ...narrativeHandlers,
  ...entityHandlers,
  ...sceneHandlers
};