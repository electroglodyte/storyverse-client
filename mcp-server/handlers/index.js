// handlers/index.js
const styleHandlers = require('./style-handlers');
const narrativeHandlers = require('./narrative-handlers');
const entityHandlers = require('./entity-handlers');
const sceneHandlers = require('./scene-handlers');

module.exports = {
  ...styleHandlers,
  ...narrativeHandlers,
  ...entityHandlers,
  ...sceneHandlers
};