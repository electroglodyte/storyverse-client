// tools/index.js
const styleTool = require('./style-tools');
const narrativeTools = require('./narrative-tools');
const entityTools = require('./entity-tools');

module.exports = {
  ...styleTool,
  ...narrativeTools,
  ...entityTools
};