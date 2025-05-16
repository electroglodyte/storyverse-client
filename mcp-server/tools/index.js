// tools/index.js
import styleTool from './style-tools.js';
import narrativeTools from './narrative-tools.js';
import entityTools from './entity-tools.js';
import sceneTools from './scene-tools.js';
import importTools from './import-tools.js';

export default {
  ...styleTool,
  ...narrativeTools,
  ...entityTools,
  ...sceneTools,
  ...importTools
};