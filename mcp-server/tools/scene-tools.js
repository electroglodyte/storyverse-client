// scene-tools.js
const importSceneTool = {
  name: "import_scene",
  description: "Imports a new scene into the system",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The content of the scene"
      },
      title: {
        type: "string",
        description: "Title for the scene"
      },
      project_id: {
        type: "string",
        description: "ID of the project/story this scene belongs to"
      },
      type: {
        type: "string",
        description: "Type of the scene (scene, chapter, etc.)",
        default: "scene"
      },
      format: {
        type: "string",
        description: "Format of the content (plain, markdown, fountain)",
        default: "plain"
      },
      sequence_number: {
        type: "number",
        description: "Position in the sequence (optional)"
      }
    },
    required: ["content", "project_id"]
  }
};

const importTextTool = {
  name: "import_text",
  description: "Imports and parses a full text into multiple scenes",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The full text content to import"
      },
      project_id: {
        type: "string",
        description: "ID of the project/story this text belongs to"
      },
      detect_scenes: {
        type: "boolean",
        description: "Whether to automatically detect and split scenes",
        default: true
      },
      scene_delimiter: {
        type: "string",
        description: "Custom delimiter pattern to split scenes (optional)"
      }
    },
    required: ["content", "project_id"]
  }
};

const createSceneVersionTool = {
  name: "create_scene_version",
  description: "Creates a new version of an existing scene",
  inputSchema: {
    type: "object",
    properties: {
      scene_id: {
        type: "string",
        description: "ID of the scene to version"
      },
      content: {
        type: "string",
        description: "New content for the scene"
      },
      notes: {
        type: "string",
        description: "Notes about the changes in this version"
      }
    },
    required: ["scene_id", "content"]
  }
};

const getSceneVersionsTool = {
  name: "get_scene_versions",
  description: "Retrieves version history for a scene",
  inputSchema: {
    type: "object",
    properties: {
      scene_id: {
        type: "string",
        description: "ID of the scene to get versions for"
      }
    },
    required: ["scene_id"]
  }
};

const restoreSceneVersionTool = {
  name: "restore_scene_version",
  description: "Restores a scene to a previous version",
  inputSchema: {
    type: "object",
    properties: {
      version_id: {
        type: "string",
        description: "ID of the version to restore"
      }
    },
    required: ["version_id"]
  }
};

const compareSceneVersionsTool = {
  name: "compare_scene_versions",
  description: "Creates a detailed comparison between two scene versions",
  inputSchema: {
    type: "object",
    properties: {
      scene_id: {
        type: "string",
        description: "ID of the scene to compare versions"
      },
      version_1: {
        type: "number",
        description: "First version number to compare"
      },
      version_2: {
        type: "number",
        description: "Second version number to compare"
      },
      format: {
        type: "string",
        description: "Output format (html, text, json)",
        default: "html"
      }
    },
    required: ["scene_id"]
  }
};

const addSceneCommentTool = {
  name: "add_scene_comment",
  description: "Adds a comment to a scene",
  inputSchema: {
    type: "object",
    properties: {
      scene_id: {
        type: "string",
        description: "ID of the scene to comment on"
      },
      content: {
        type: "string",
        description: "Content of the comment"
      },
      position: {
        type: "object",
        description: "Position within the scene (optional)"
      },
      type: {
        type: "string",
        description: "Type of comment (comment, suggestion, revision)",
        default: "comment"
      }
    },
    required: ["scene_id", "content"]
  }
};

const resolveSceneCommentTool = {
  name: "resolve_scene_comment",
  description: "Marks a comment as resolved or unresolved",
  inputSchema: {
    type: "object",
    properties: {
      comment_id: {
        type: "string",
        description: "ID of the comment to resolve/unresolve"
      },
      resolved: {
        type: "boolean",
        description: "Whether the comment is resolved",
        default: true
      }
    },
    required: ["comment_id"]
  }
};

const processSceneTool = {
  name: "process_scene",
  description: "Processes a scene according to instructions, creating a new version",
  inputSchema: {
    type: "object",
    properties: {
      scene_id: {
        type: "string",
        description: "ID of the scene to process"
      },
      instructions: {
        type: "string",
        description: "Processing instructions (e.g., 'Rewrite in past tense')"
      }
    },
    required: ["scene_id", "instructions"]
  }
};

const addressSceneCommentsTool = {
  name: "address_scene_comments",
  description: "Creates a new scene version that addresses specified comments",
  inputSchema: {
    type: "object",
    properties: {
      scene_id: {
        type: "string",
        description: "ID of the scene with comments"
      },
      comment_ids: {
        type: "array",
        items: {
          type: "string"
        },
        description: "IDs of comments to address (optional, if null address all unresolved)"
      }
    },
    required: ["scene_id"]
  }
};

const exportProjectTool = {
  name: "export_project",
  description: "Exports a complete project as a single document",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "ID of the project/story to export"
      },
      format: {
        type: "string",
        description: "Export format (text, markdown, html)",
        default: "text"
      },
      include_types: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Scene types to include (optional, if null include all)"
      }
    },
    required: ["project_id"]
  }
};

const exportFountainTool = {
  name: "export_fountain",
  description: "Exports scenes in Fountain format for screenplay formatting",
  inputSchema: {
    type: "object",
    properties: {
      project_id: {
        type: "string",
        description: "ID of the project/story to export"
      },
      scene_ids: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Specific scenes to export (optional, if null export all)"
      },
      include_title_page: {
        type: "boolean",
        description: "Whether to include a Fountain title page",
        default: true
      }
    },
    required: ["project_id"]
  }
};

// New tool definitions
const splitSceneTool = {
  name: "split_scene",
  description: "Splits a scene into multiple scenes at specified positions",
  inputSchema: {
    type: "object",
    properties: {
      scene_id: {
        type: "string",
        description: "ID of the scene to split"
      },
      split_points: {
        type: "array",
        items: {
          type: "object",
          properties: {
            content_position: {
              type: "number",
              description: "Character position in the scene content where to split"
            },
            title: {
              type: "string",
              description: "Title for the new scene"
            }
          },
          required: ["content_position", "title"]
        },
        description: "Points where to split the scene"
      }
    },
    required: ["scene_id", "split_points"]
  }
};

const combineScenesTool = {
  name: "combine_scenes",
  description: "Combines multiple scenes into a single scene",
  inputSchema: {
    type: "object",
    properties: {
      scene_ids: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Array of scene IDs to combine, in order"
      },
      new_title: {
        type: "string",
        description: "Title for the combined scene"
      }
    },
    required: ["scene_ids", "new_title"]
  }
};

const sceneToWritingSampleTool = {
  name: "scene_to_writing_sample",
  description: "Creates a writing sample from a scene's content",
  inputSchema: {
    type: "object",
    properties: {
      scene_id: {
        type: "string",
        description: "ID of the scene to convert to a sample"
      },
      sample_name: {
        type: "string",
        description: "Name for the new writing sample"
      },
      tags: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Tags for categorizing the sample"
      }
    },
    required: ["scene_id", "sample_name"]
  }
};

const detectStorylinesTool = {
  name: "detect_storylines",
  description: "Analyzes a story's content and structure to identify distinct storylines and plot arcs",
  inputSchema: {
    type: "object",
    properties: {
      story_id: {
        type: "string",
        description: "ID of the story to analyze"
      },
      min_confidence: {
        type: "number",
        description: "Minimum confidence threshold (0.0-1.0) for storyline detection",
        default: 0.7
      }
    },
    required: ["story_id"]
  }
};

export default {
  importSceneTool,
  importTextTool,
  createSceneVersionTool,
  getSceneVersionsTool,
  restoreSceneVersionTool,
  compareSceneVersionsTool,
  addSceneCommentTool,
  resolveSceneCommentTool,
  processSceneTool,
  addressSceneCommentsTool,
  exportProjectTool,
  exportFountainTool,
  splitSceneTool,
  combineScenesTool,
  sceneToWritingSampleTool,
  detectStorylinesTool
};