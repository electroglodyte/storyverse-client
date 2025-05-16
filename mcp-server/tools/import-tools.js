// mcp-server/tools/import-tools.js

/**
 * Import Tool Definitions
 */

// New approach - single comprehensive tool
const importAnalyzedStoryTool = {
  name: "import_analyzed_story",
  description: "Imports pre-analyzed story data (produced by Claude) into the database, handling entity relationships and deduplication",
  inputSchema: {
    type: "object",
    properties: {
      data: {
        type: "object",
        description: "The pre-analyzed story data with all entity information",
        properties: {
          storyWorld: {
            type: "object",
            description: "Story world information"
          },
          story: {
            type: "object",
            description: "Story information",
            required: true
          },
          characters: {
            type: "array",
            items: {
              type: "object"
            },
            description: "Character entities"
          },
          locations: {
            type: "array",
            items: {
              type: "object"
            },
            description: "Location entities"
          },
          factions: {
            type: "array",
            items: {
              type: "object"
            },
            description: "Faction entities"
          },
          objects: {
            type: "array",
            items: {
              type: "object"
            },
            description: "Object/item entities"
          },
          events: {
            type: "array",
            items: {
              type: "object"
            },
            description: "Event entities"
          },
          relationships: {
            type: "array",
            items: {
              type: "object"
            },
            description: "Character relationships"
          },
          plotlines: {
            type: "array",
            items: {
              type: "object"
            },
            description: "Plotline entities"
          },
          scenes: {
            type: "array",
            items: {
              type: "object"
            },
            description: "Scene entities"
          }
        }
      }
    },
    required: ["data"]
  }
};

// Export only the new tool
export default {
  importAnalyzedStoryTool
};