/**
 * Exports all tools from the various tool module files
 */

const styleTool = require('./style-tools');
const narrativeTools = require('./narrative-tools');
const entityTools = require('./entity-tools');

module.exports = {
  ...styleTool,
  ...narrativeTools,
  ...entityTools
};
