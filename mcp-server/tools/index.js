// tools/index.js
import styleTool from './style-tools.js';
import narrativeTools from './narrative-tools.js';
import entityTools from './entity-tools.js';

export default {
  ...styleTool,
  ...narrativeTools,
  ...entityTools
};