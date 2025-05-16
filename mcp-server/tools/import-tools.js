// mcp-server/tools/import-tools.js

/**
 * Import Tool Definitions
 */

const analyzeImportedStoryTool = {
  name: "analyze_imported_story",
  description: "Analyzes an imported story and extracts narrative elements like characters, locations, events, and plot structure",
  inputSchema: {
    type: "object",
    properties: {
      story_text: {
        type: "string",
        description: "Raw story text to analyze"
      },
      story_title: {
        type: "string",
        description: "Title for the story"
      },
      options: {
        type: "object",
        properties: {
          create_project: {
            type: "boolean",
            description: "Whether to create a new story entry",
            default: true
          },
          story_id: {
            type: "string",
            description: "Existing story ID (if create_project is false)"
          },
          story_world_id: {
            type: "string",
            description: "Optional story world ID to associate with"
          },
          interactive_mode: {
            type: "boolean",
            description: "Whether to prompt for confirmation on ambiguous entities",
            default: true
          },
          resolution_threshold: {
            type: "number",
            description: "Threshold for entity resolution (0.0-1.0)",
            default: 0.7
          },
          extract_characters: {
            type: "boolean",
            description: "Whether to extract characters",
            default: true
          },
          extract_locations: {
            type: "boolean",
            description: "Whether to extract locations",
            default: true
          },
          extract_events: {
            type: "boolean",
            description: "Whether to extract events",
            default: true
          },
          extract_relationships: {
            type: "boolean",
            description: "Whether to extract relationships between entities",
            default: true
          }
        },
        default: {}
      }
    },
    required: ["story_text", "story_title"]
  }
};

const extractStoryElementsTool = {
  name: "extract_story_elements",
  description: "Extracts characters, locations, events, and other narrative elements from an imported text",
  inputSchema: {
    type: "object",
    properties: {
      story_text: {
        type: "string",
        description: "The text content to analyze"
      },
      options: {
        type: "object",
        properties: {
          extraction_types: {
            type: "array",
            items: {
              type: "string",
              enum: ["characters", "locations", "plotlines", "scenes"]
            },
            description: "Types of elements to extract",
            default: ["characters", "locations", "plotlines"]
          },
          confidence_threshold: {
            type: "number",
            description: "Minimum confidence level for extracted elements (0.0-1.0)",
            default: 0.6
          }
        },
        default: {}
      }
    },
    required: ["story_text"]
  }
};

const importStoryWithProgressTool = {
  name: "import_story_with_progress",
  description: "Imports and analyzes a story with real-time progress updates on detected elements",
  inputSchema: {
    type: "object",
    properties: {
      story_text: {
        type: "string",
        description: "Raw story text to analyze"
      },
      story_title: {
        type: "string",
        description: "Title for the story"
      },
      options: {
        type: "object",
        properties: {
          create_project: {
            type: "boolean",
            description: "Whether to create a new story entry",
            default: true
          },
          story_id: {
            type: "string",
            description: "Existing story ID (if create_project is false)"
          },
          story_world_id: {
            type: "string",
            description: "Optional story world ID to associate with"
          },
          extract_characters: {
            type: "boolean",
            description: "Whether to extract characters",
            default: true
          },
          extract_locations: {
            type: "boolean",
            description: "Whether to extract locations",
            default: true
          },
          extract_plotlines: {
            type: "boolean",
            description: "Whether to extract plotlines",
            default: true
          },
          extract_scenes: {
            type: "boolean",
            description: "Whether to extract scenes",
            default: true
          },
          confidence_threshold: {
            type: "number",
            description: "Minimum confidence level for extracted elements (0.0-1.0)",
            default: 0.6
          }
        },
        default: {}
      }
    },
    required: ["story_text", "story_title"]
  }
};

export default {
  analyzeImportedStoryTool,
  extractStoryElementsTool,
  importStoryWithProgressTool
};