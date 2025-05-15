/**
 * Style Analysis Tool Definitions
 */

const analyzeWritingSampleTool = {
  name: "analyze_writing_sample",
  description: "Analyzes a text sample to identify writing style characteristics and patterns",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string", 
        description: "The text content to analyze"
      },
      saveSample: {
        type: "boolean",
        description: "Whether to save the text as a sample in the database",
        default: true
      },
      title: {
        type: "string",
        description: "Title for the writing sample (required if saveSample is true and no sampleId provided)"
      },
      author: {
        type: "string",
        description: "Author of the writing sample"
      },
      sampleType: {
        type: "string",
        description: "Type of writing (novel, screenplay, etc.)"
      },
      tags: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Tags for categorizing the sample"
      },
      projectId: {
        type: "string",
        description: "ID of the project this sample belongs to"
      },
      sampleId: {
        type: "string",
        description: "Optional ID of existing sample to update with analysis"
      }
    },
    required: ["text"]
  }
};

const getStyleProfileTool = {
  name: "get_style_profile",
  description: "Retrieves a writing style profile with guidance for writing in that style",
  inputSchema: {
    type: "object",
    properties: {
      profileId: {
        type: "string",
        description: "ID of the style profile to retrieve"
      },
      includeExamples: {
        type: "boolean",
        description: "Whether to include sample excerpts",
        default: false
      },
      includeStyleNotes: {
        type: "boolean",
        description: "Whether to include human-readable style guidance notes",
        default: true
      }
    },
    required: ["profileId"]
  }
};

const createStyleProfileTool = {
  name: "create_style_profile",
  description: "Creates or updates a style profile based on analyzed writing samples",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name for this style profile"
      },
      description: {
        type: "string",
        description: "Description of this style profile"
      },
      sampleIds: {
        type: "array",
        items: {
          type: "string"
        },
        description: "IDs of writing samples to include in this profile"
      },
      projectId: {
        type: "string",
        description: "ID of the project this profile belongs to"
      },
      profileId: {
        type: "string",
        description: "Optional ID of existing profile to update"
      },
      genre: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Genres associated with this style profile"
      },
      comparableAuthors: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Authors with similar writing style"
      },
      userComments: {
        type: "string",
        description: "Additional notes or requirements for this style"
      },
      representativeSamples: {
        type: "array",
        items: {
          type: "object",
          properties: {
            textContent: {
              type: "string",
              description: "An exemplary text passage representing this style"
            },
            description: {
              type: "string",
              description: "Description of what makes this sample representative"
            }
          }
        },
        description: "Text samples that exemplify this writing style"
      },
      addToExisting: {
        type: "boolean",
        description: "Whether to add these samples to an existing profile instead of replacing",
        default: false
      }
    },
    required: ["name", "sampleIds"]
  }
};

const writeInStyleTool = {
  name: "write_in_style",
  description: "Instructs Claude to write text following a specific style profile",
  inputSchema: {
    type: "object",
    properties: {
      profileId: {
        type: "string",
        description: "ID of the style profile to use"
      },
      prompt: {
        type: "string",
        description: "What to write about"
      },
      length: {
        type: "number",
        description: "Approximate target word count"
      },
      includeStyleNotes: {
        type: "boolean",
        description: "Whether to include style guidance notes",
        default: true
      }
    },
    required: ["prompt"]
  }
};

module.exports = {
  analyzeWritingSampleTool,
  getStyleProfileTool,
  createStyleProfileTool,
  writeInStyleTool
};
