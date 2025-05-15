require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

// Initialize Supabase client with explicit fallback values
const supabaseUrl = process.env.SUPABASE_URL || 'https://rkmjjhjjpnhjymqmcvpe.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbWpqaGpqcG5oanltcW1jdnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MzM5NDUsImV4cCI6MjA2MjQwOTk0NX0.GlxA96751aHLq0Bi6nhKXtWHF0tlmWvsemGr3heQ13k';

console.error("Using Supabase URL:", supabaseUrl);
console.error("Supabase key starts with:", supabaseKey.substring(0, 10) + "...");

const supabase = createClient(supabaseUrl, supabaseKey);

// ======================================================
// STYLE ANALYSIS TOOL DEFINITIONS
// ======================================================

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

// ======================================================
// NARRATIVE STRUCTURE TOOL DEFINITIONS
// ======================================================

const getCharacterJourneyTool = {
  name: "get_character_journey",
  description: "Retrieves a character's complete journey of events in sequence order",
  inputSchema: {
    type: "object",
    properties: {
      character_id: {
        type: "string",
        description: "UUID of the character"
      },
      story_id: {
        type: "string",
        description: "Optional UUID of story to filter events",
      }
    },
    required: ["character_id"]
  }
};

const compareCharacterJourneysTool = {
  name: "compare_character_journeys",
  description: "Compare multiple characters' journeys, highlighting shared events and interactions",
  inputSchema: {
    type: "object",
    properties: {
      character_ids: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Array of character UUIDs to compare"
      },
      story_id: {
        type: "string",
        description: "Optional UUID of story to filter events",
      }
    },
    required: ["character_ids"]
  }
};

const updateEventSequenceTool = {
  name: "update_event_sequence",
  description: "Safely updates an event's sequence number, maintaining dependencies",
  inputSchema: {
    type: "object",
    properties: {
      event_id: {
        type: "string",
        description: "UUID of event to update"
      },
      new_sequence_number: {
        type: "number",
        description: "New sequence position for the event"
      }
    },
    required: ["event_id", "new_sequence_number"]
  }
};

const normalizeEventSequenceTool = {
  name: "normalize_event_sequence",
  description: "Normalizes event sequence numbers to be evenly distributed",
  inputSchema: {
    type: "object",
    properties: {
      story_id: {
        type: "string",
        description: "UUID of story to normalize"
      },
      start_value: {
        type: "number",
        description: "Starting sequence value",
        default: 10
      },
      interval: {
        type: "number",
        description: "Interval between events",
        default: 10
      }
    },
    required: ["story_id"]
  }
};

const createStoryEventTool = {
  name: "create_story_event",
  description: "Creates a new story event with optional dependencies",
  inputSchema: {
    type: "object",
    properties: {
      event_data: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Event title"
          },
          description: {
            type: "string",
            description: "Event description"
          },
          story_id: {
            type: "string",
            description: "Foreign key to stories"
          },
          visible: {
            type: "boolean",
            description: "Whether it's directly shown or just backstory",
            default: true
          },
          sequence_number: {
            type: "number",
            description: "For ordering events (optional)"
          },
          chronological_time: {
            type: "string",
            description: "When the event happens in story world time (optional)"
          },
          relative_time_offset: {
            type: "string",
            description: "For stories without absolute dates (optional)"
          }
        },
        required: ["title", "story_id"]
      },
      dependency_data: {
        type: "object",
        properties: {
          predecessors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                event_id: {
                  type: "string",
                  description: "ID of predecessor event"
                },
                dependency_type: {
                  type: "string",
                  description: "Type of dependency relation",
                  enum: ["causal", "prerequisite", "thematic", "chronological"]
                },
                strength: {
                  type: "number",
                  description: "How rigid this relationship is (1-10)",
                  default: 5
                }
              },
              required: ["event_id"]
            }
          },
          successors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                event_id: {
                  type: "string",
                  description: "ID of successor event"
                },
                dependency_type: {
                  type: "string",
                  description: "Type of dependency relation",
                  enum: ["causal", "prerequisite", "thematic", "chronological"]
                },
                strength: {
                  type: "number",
                  description: "How rigid this relationship is (1-10)",
                  default: 5
                }
              },
              required: ["event_id"]
            }
          }
        }
      }
    },
    required: ["event_data"]
  }
};

const addEventWithDependenciesTool = {
  name: "add_event_with_dependencies",
  description: "Adds an event with multiple dependencies and proper positioning in the sequence",
  inputSchema: {
    type: "object",
    properties: {
      event_data: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Event title"
          },
          description: {
            type: "string",
            description: "Event description"
          },
          story_id: {
            type: "string",
            description: "Foreign key to stories"
          },
          visible: {
            type: "boolean",
            description: "Whether it's directly shown or just backstory",
            default: true
          },
          chronological_time: {
            type: "string",
            description: "When the event happens in story world time (optional)"
          }
        },
        required: ["title", "story_id"]
      },
      predecessors: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Event IDs that come before this event",
        default: []
      },
      successors: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Event IDs that come after this event",
        default: []
      }
    },
    required: ["event_data"]
  }
};

const addCharacterEventTool = {
  name: "add_character_event",
  description: "Adds an event to a character's journey",
  inputSchema: {
    type: "object",
    properties: {
      character_id: {
        type: "string",
        description: "UUID of character"
      },
      event_data: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Event title"
          },
          description: {
            type: "string",
            description: "Event description"
          },
          story_id: {
            type: "string",
            description: "Foreign key to stories"
          },
          importance: {
            type: "number",
            description: "Importance of this event to the character (1-10)",
            default: 5
          },
          experience_type: {
            type: "string",
            description: "How the character experiences this event (active, passive, off-screen)",
            enum: ["active", "passive", "off-screen"],
            default: "active"
          },
          notes: {
            type: "string",
            description: "Additional notes about character's involvement in this event"
          }
        },
        required: ["title", "story_id"]
      },
      journey_position: {
        type: "number",
        description: "Position in character's journey (null to add at end)",
        default: null
      }
    },
    required: ["character_id", "event_data"]
  }
};

const findSharedEventsTool = {
  name: "find_shared_events",
  description: "Find events shared between multiple characters",
  inputSchema: {
    type: "object",
    properties: {
      character_ids: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Array of character UUIDs to check"
      },
      story_id: {
        type: "string",
        description: "Optional UUID of story to filter events"
      }
    },
    required: ["character_ids"]
  }
};

const addSceneWithEventsTool = {
  name: "add_scene_with_events",
  description: "Creates a scene and optionally a corresponding event",
  inputSchema: {
    type: "object",
    properties: {
      scene_data: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Scene title"
          },
          description: {
            type: "string",
            description: "Scene description"
          },
          content: {
            type: "string",
            description: "Scene content/text"
          },
          story_id: {
            type: "string",
            description: "Foreign key to stories"
          },
          sequence_number: {
            type: "number",
            description: "For ordering (optional)"
          },
          characters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "Character ID"
                },
                importance: {
                  type: "string",
                  description: "Character importance in scene",
                  enum: ["primary", "secondary", "background"],
                  default: "secondary"
                }
              },
              required: ["id"]
            },
            description: "Characters in this scene"
          },
          locations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "Location ID"
                }
              },
              required: ["id"]
            },
            description: "Locations in this scene"
          }
        },
        required: ["title", "story_id"]
      },
      event_data: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Optional ID of existing event to link to the scene"
          },
          title: {
            type: "string",
            description: "Event title (if creating new event)"
          },
          description: {
            type: "string",
            description: "Event description (if creating new event)"
          }
        },
        default: null
      }
    },
    required: ["scene_data"]
  }
};

const visualizeTimelineTool = {
  name: "visualize_timeline",
  description: "Generates a visual representation of events and their relationships",
  inputSchema: {
    type: "object",
    properties: {
      story_id: {
        type: "string",
        description: "UUID of story to visualize"
      },
      format: {
        type: "string",
        description: "Visualization format",
        enum: ["react-flow", "timeline", "structured"],
        default: "react-flow"
      }
    },
    required: ["story_id"]
  }
};

const analyzeEventImpactTool = {
  name: "analyze_event_impact",
  description: "Analyzes how an event impacts characters and the story",
  inputSchema: {
    type: "object",
    properties: {
      event_id: {
        type: "string",
        description: "UUID of event to analyze"
      }
    },
    required: ["event_id"]
  }
};

const detectDependencyConflictsTool = {
  name: "detect_dependency_conflicts",
  description: "Detects logical inconsistencies in event dependencies",
  inputSchema: {
    type: "object",
    properties: {
      story_id: {
        type: "string",
        description: "UUID of story to analyze"
      }
    },
    required: ["story_id"]
  }
};

const suggestMissingEventsTool = {
  name: "suggest_missing_events",
  description: "Suggests potential missing events in a story",
  inputSchema: {
    type: "object",
    properties: {
      story_id: {
        type: "string",
        description: "UUID of story to analyze"
      }
    },
    required: ["story_id"]
  }
};

const analyzeStoryTool = {
  name: "analyze_story",
  description: "Master function for analyzing an entire story and populating database",
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

// ======================================================
// ENTITY CREATION TOOL DEFINITIONS
// ======================================================


const setupStoryWorldTool = {
  name: "setup_story_world",
  description: "Set up a new story world",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the story world"
      },
      description: {
        type: "string",
        description: "Description of the story world"
      },
      genre: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Genres associated with this story world"
      },
      tags: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Tags for categorizing the story world"
      },
      time_period: {
        type: "string",
        description: "Time period of the story world (e.g., 'Medieval', 'Modern', '2150-2200')"
      },
      rules: {
        type: "string",
        description: "Special rules or physics of this story world"
      },
      image_url: {
        type: "string",
        description: "URL for an image representing this story world"
      },
      notes: {
        type: "string",
        description: "Additional notes about the story world"
      }
    },
    required: ["name"]
  }
};

const setupSeriesTool = {
  name: "setup_series",
  description: "Set up a new series and optionally link it to a story world",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the series"
      },
      description: {
        type: "string",
        description: "Description of the series"
      },
      story_world_id: {
        type: "string",
        description: "ID of the story world this series belongs to (optional)"
      },
      tags: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Tags for categorizing the series"
      },
      status: {
        type: "string",
        description: "Current status of the series",
        enum: ["planned", "in-progress", "completed", "on-hold"]
      },
      target_length: {
        type: "number",
        description: "Target number of stories in this series"
      },
      image_url: {
        type: "string",
        description: "URL for an image representing this series"
      },
      notes: {
        type: "string",
        description: "Additional notes about the series"
      }
    },
    required: ["name"]
  }
};

const setupStoryTool = {
  name: "setup_story",
  description: "Set up a new story and optionally link it to a story world or series",
  inputSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Title of the story"
      },
      description: {
        type: "string",
        description: "Description or summary of the story"
      },
      story_world_id: {
        type: "string",
        description: "ID of the story world this story belongs to (optional)"
      },
      series_id: {
        type: "string",
        description: "ID of the series this story belongs to (optional)"
      },
      status: {
        type: "string",
        description: "Current status of the story",
        enum: ["concept", "outline", "draft", "revision", "completed"]
      },
      story_type: {
        type: "string", 
        description: "Type of story",
        enum: ["novel", "short_story", "screenplay", "episode", "other"]
      },
      word_count_target: {
        type: "number",
        description: "Target word count for this story"
      },
      synopsis: {
        type: "string",
        description: "Detailed synopsis of the story"
      },
      image_url: {
        type: "string",
        description: "URL for an image representing this story"
      },
      notes: {
        type: "string",
        description: "Additional notes about the story"
      }
    },
    required: ["title"]
  }
};

const createCharacterTool = {
  name: "create_character",
  description: "Create a new character and optionally link it to a story world or story",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the character"
      },
      description: {
        type: "string",
        description: "Brief description of the character"
      },
      story_world_id: {
        type: "string",
        description: "ID of the story world this character belongs to (optional)"
      },
      story_id: {
        type: "string",
        description: "ID of the specific story this character belongs to (optional)"
      },
      role: {
        type: "string",
        description: "Role of the character",
        enum: ["protagonist", "antagonist", "supporting", "background", "other"]
      },
      appearance: {
        type: "string",
        description: "Physical appearance of the character"
      },
      background: {
        type: "string", 
        description: "Character's backstory or history"
      },
      motivation: {
        type: "string",
        description: "Character's primary motivation"
      },
      personality: {
        type: "string",
        description: "Character's personality traits"
      },
      age: {
        type: "string",
        description: "Character's age or age range"
      },
      faction_id: {
        type: "string",
        description: "ID of the faction this character belongs to (optional)"
      },
      location_id: {
        type: "string",
        description: "ID of the character's home location (optional)"
      },
      image_url: {
        type: "string",
        description: "URL for an image representing this character"
      },
      notes: {
        type: "string",
        description: "Additional notes about the character"
      }
    },
    required: ["name"]
  }
};

const createLocationTool = {
  name: "create_location",
  description: "Create a new location and optionally link it to a story world or story",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the location"
      },
      description: {
        type: "string",
        description: "Description of the location"
      },
      story_world_id: {
        type: "string",
        description: "ID of the story world this location belongs to (optional)"
      },
      story_id: {
        type: "string",
        description: "ID of the specific story this location belongs to (optional)"
      },
      location_type: {
        type: "string",
        description: "Type of location",
        enum: ["city", "building", "natural", "country", "planet", "realm", "other"]
      },
      parent_location_id: {
        type: "string",
        description: "ID of the parent location (for hierarchical locations)"
      },
      climate: {
        type: "string",
        description: "Climate of the location"
      },
      culture: {
        type: "string",
        description: "Cultural aspects of the location"
      },
      map_coordinates: {
        type: "string",
        description: "Coordinates or position on a map"
      },
      notable_features: {
        type: "string",
        description: "Notable or unique features of this location"
      },
      image_url: {
        type: "string",
        description: "URL for an image representing this location"
      },
      notes: {
        type: "string",
        description: "Additional notes about the location"
      }
    },
    required: ["name"]
  }
};

const createFactionTool = {
  name: "create_faction",
  description: "Create a new faction and optionally link it to a story world or story",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the faction"
      },
      description: {
        type: "string",
        description: "Description of the faction"
      },
      story_world_id: {
        type: "string",
        description: "ID of the story world this faction belongs to (optional)"
      },
      story_id: {
        type: "string",
        description: "ID of the specific story this faction belongs to (optional)"
      },
      faction_type: {
        type: "string",
        description: "Type of faction",
        enum: ["government", "organization", "family", "species", "religion", "other"]
      },
      leader_character_id: {
        type: "string",
        description: "ID of the character who leads this faction (optional)"
      },
      headquarters_location_id: {
        type: "string",
        description: "ID of the faction's headquarters location (optional)"
      },
      ideology: {
        type: "string",
        description: "The faction's ideology or belief system"
      },
      goals: {
        type: "string",
        description: "The faction's goals or objectives"
      },
      resources: {
        type: "string",
        description: "Resources controlled by the faction"
      },
      image_url: {
        type: "string",
        description: "URL for an image representing this faction"
      },
      notes: {
        type: "string",
        description: "Additional notes about the faction"
      }
    },
    required: ["name"]
  }
};

const createRelationshipTool = {
  name: "create_relationship",
  description: "Create a relationship between two characters",
  inputSchema: {
    type: "object",
    properties: {
      character1_id: {
        type: "string",
        description: "ID of the first character in the relationship"
      },
      character2_id: {
        type: "string",
        description: "ID of the second character in the relationship"
      },
      relationship_type: {
        type: "string",
        description: "Type of relationship",
        enum: ["family", "friend", "ally", "enemy", "romantic", "professional", "other"]
      },
      description: {
        type: "string",
        description: "Description of the relationship"
      },
      intensity: {
        type: "number",
        description: "Intensity of the relationship (1-10)",
        minimum: 1,
        maximum: 10
      },
      story_id: {
        type: "string",
        description: "ID of the story this relationship is relevant to (optional)"
      },
      notes: {
        type: "string",
        description: "Additional notes about the relationship"
      }
    },
    required: ["character1_id", "character2_id", "relationship_type"]
  }
};

const createItemTool = {
  name: "create_item",
  description: "Create a new item/artifact in the story world",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name of the item"
      },
      description: {
        type: "string",
        description: "Description of the item"
      },
      story_world_id: {
        type: "string",
        description: "ID of the story world this item belongs to (optional)"
      },
      story_id: {
        type: "string",
        description: "ID of the specific story this item belongs to (optional)"
      },
      item_type: {
        type: "string",
        description: "Type of item",
        enum: ["weapon", "tool", "clothing", "magical", "technology", "document", "other"]
      },
      owner_character_id: {
        type: "string",
        description: "ID of the character who owns this item (optional)"
      },
      location_id: {
        type: "string",
        description: "ID of the location where this item is found (optional)"
      },
      properties: {
        type: "string",
        description: "Special properties or abilities of the item"
      },
      significance: {
        type: "string",
        description: "Narrative significance of the item"
      },
      image_url: {
        type: "string",
        description: "URL for an image representing this item"
      },
      notes: {
        type: "string",
        description: "Additional notes about the item"
      }
    },
    required: ["name"]
  }
};

const createCharacterArcTool = {
  name: "create_character_arc",
  description: "Create a character development arc for a story",
  inputSchema: {
    type: "object",
    properties: {
      character_id: {
        type: "string",
        description: "ID of the character this arc belongs to"
      },
      story_id: {
        type: "string",
        description: "ID of the story this arc is part of"
      },
      title: {
        type: "string",
        description: "Title or name of this character arc"
      },
      description: {
        type: "string",
        description: "Description of the character arc"
      },
      starting_state: {
        type: "string",
        description: "Character's state at the beginning of the arc"
      },
      ending_state: {
        type: "string",
        description: "Character's state at the end of the arc"
      },
      catalyst: {
        type: "string",
        description: "Event or situation that initiates the character arc"
      },
      challenges: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Challenges the character faces during this arc"
      },
      key_events: {
        type: "array",
        items: {
          type: "string"
        },
        description: "IDs of key events in this character arc"
      },
      theme: {
        type: "string",
        description: "Thematic element of this character arc"
      },
      notes: {
        type: "string",
        description: "Additional notes about the character arc"
      }
    },
    required: ["character_id", "story_id", "title"]
  }
};

const createPlotlineTool = {
  name: "create_plotline",
  description: "Create a plotline for a story",
  inputSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Title of the plotline"
      },
      description: {
        type: "string",
        description: "Description of the plotline"
      },
      story_id: {
        type: "string",
        description: "ID of the story this plotline belongs to"
      },
      plotline_type: {
        type: "string",
        description: "Type of plotline",
        enum: ["main", "subplot", "character", "thematic", "other"]
      },
      events: {
        type: "array",
        items: {
          type: "string"
        },
        description: "IDs of events in this plotline"
      },
      characters: {
        type: "array",
        items: {
          type: "string"
        },
        description: "IDs of characters involved in this plotline"
      },
      starting_event_id: {
        type: "string",
        description: "ID of the event that starts this plotline"
      },
      climax_event_id: {
        type: "string",
        description: "ID of the event that serves as the climax of this plotline"
      },
      resolution_event_id: {
        type: "string",
        description: "ID of the event that resolves this plotline"
      },
      theme: {
        type: "string",
        description: "Thematic element of this plotline"
      },
      notes: {
        type: "string",
        description: "Additional notes about the plotline"
      }
    },
    required: ["title", "story_id"]
  }
};


// ======================================================
// STYLE ANALYSIS HELPER FUNCTIONS
// ======================================================

// Calculate average sentence length and other metrics
const calculateSentenceMetrics = (text) => {
  const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
  const sentenceLengths = sentences.map(sentence => sentence.split(/\s+/).filter(Boolean).length);
  const avgLength = sentenceLengths.reduce((sum, length) => sum + length, 0) / sentences.length || 0;

  // Calculate length distribution
  const shortSentences = sentenceLengths.filter(len => len <= 10).length;
  const mediumSentences = sentenceLengths.filter(len => len > 10 && len <= 20).length;
  const longSentences = sentenceLengths.filter(len => len > 20).length;

  return {
    avg_length: avgLength,
    length_distribution: {
      short: shortSentences / sentences.length || 0,
      medium: mediumSentences / sentences.length || 0,
      long: longSentences / sentences.length || 0
    },
    complexity_score: Math.min(1, avgLength / 25),
    question_frequency: (text.match(/\?/g) || []).length / sentences.length || 0,
    fragment_frequency: sentences.filter(s => s.split(/\s+/).filter(Boolean).length < 5).length / sentences.length || 0
  };
};

// Calculate vocabulary metrics
const calculateVocabularyMetrics = (text) => {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));

  return {
    lexical_diversity: uniqueWords.size / words.length || 0,
    formality_score: 0.65, // Placeholder
    unusual_word_frequency: 0.05, // Placeholder
    part_of_speech_distribution: {
      nouns: 0.25,
      verbs: 0.2,
      adjectives: 0.15,
      adverbs: 0.08
    }
  };
};

// Analyze narrative characteristics
const analyzeNarrativeCharacteristics = (text) => {
  // Simple POV detection
  const firstPersonIndicators = (text.match(/\b(I|me|my|mine|we|us|our|ours)\b/gi) || []).length;
  const thirdPersonIndicators = (text.match(/\b(he|him|his|she|her|hers|they|them|their|theirs)\b/gi) || []).length;
  
  let pov = "unknown";
  if (firstPersonIndicators > thirdPersonIndicators * 2) {
    pov = "first_person";
  } else if (thirdPersonIndicators > firstPersonIndicators) {
    pov = "third_person";
  }

  // Tense detection
  const presentTenseIndicators = (text.match(/\b(is|are|am|being|do|does|has|have)\b/gi) || []).length;
  const pastTenseIndicators = (text.match(/\b(was|were|had|did)\b/gi) || []).length;

  let tense = "unknown";
  if (presentTenseIndicators > pastTenseIndicators * 1.5) {
    tense = "present";
  } else if (pastTenseIndicators > presentTenseIndicators) {
    tense = "past";
  }

  return {
    pov,
    tense,
    description_density: 0.4, // Placeholder
    action_to_reflection_ratio: 1.5,
    show_vs_tell_balance: 0.65
  };
};

// Analyze stylistic devices
const analyzeStyleDevices = (text) => {
  return {
    metaphor_frequency: 0.02, // Placeholder
    simile_frequency: 0.015,
    alliteration_frequency: 0.008,
    repetition_patterns: 0.03
  };
};

// Analyze tone
const analyzeTone = (text) => {
  // Simplified tone analysis
  const positiveWords = ['happy', 'joy', 'love', 'excellent', 'good', 'great'];
  const negativeWords = ['sad', 'angry', 'hate', 'terrible', 'bad', 'awful'];
  const formalWords = ['therefore', 'furthermore', 'consequently', 'nevertheless'];

  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;
  const formalCount = words.filter(word => formalWords.includes(word)).length;

  let emotionalTone = [];
  if (positiveCount > negativeCount * 2) {
    emotionalTone.push('optimistic');
  } else if (negativeCount > positiveCount * 2) {
    emotionalTone.push('pessimistic');
  } else {
    emotionalTone.push('neutral');
  }

  // Add more tones based on other heuristics
  const formality = formalCount / words.length > 0.01 ? 'formal' : 'casual';

  return {
    emotional_tone: emotionalTone,
    formality_level: formality,
    humor_level: 0.2, // Placeholder
    sarcasm_level: 0.1 // Placeholder
  };
};

// Create excerpt from text (first 200 characters)
const createExcerpt = (text) => {
  // Get first 200 characters, but try to end at a sentence boundary
  const excerpt = text.slice(0, 200);
  const lastPeriod = excerpt.lastIndexOf('.');
  if (lastPeriod > 100) {
    return excerpt.slice(0, lastPeriod + 1);
  }
  return excerpt + '...';
};

// Generate a summary description of the style
const generateDescription = (
  sentenceMetrics,
  vocabularyMetrics,
  narrativeCharacteristics,
  stylistic,
  tone
) => {
  const sentenceLength = sentenceMetrics.avg_length < 12 ? 'short' :
    sentenceMetrics.avg_length < 20 ? 'moderate' : 'long';
  
  const complexity = sentenceMetrics.complexity_score < 0.4 ? 'simple' :
    sentenceMetrics.complexity_score < 0.7 ? 'moderately complex' : 'complex';
  
  const diversity = vocabularyMetrics.lexical_diversity < 0.4 ? 'limited' :
    vocabularyMetrics.lexical_diversity < 0.6 ? 'varied' : 'highly diverse';
  
  const formality = tone.formality_level === 'formal' ? 'formal' : 'conversational';
  
  const povText = narrativeCharacteristics.pov === 'first_person' ? 'first-person' :
    narrativeCharacteristics.pov === 'third_person' ? 'third-person' : 'mixed perspective';
  
  const tenseText = narrativeCharacteristics.tense === 'present' ? 'present tense' :
    narrativeCharacteristics.tense === 'past' ? 'past tense' : 'mixed tense';

  return `This writing features ${sentenceLength}, ${complexity} sentences with ${diversity} vocabulary. The style is ${formality}, written in ${povText} ${tenseText}. ${tone.emotional_tone.join(' and ')} in tone, with a ${narrativeCharacteristics.action_to_reflection_ratio > 1 ? 'focus on action over reflection' : 'balance of action and reflection'}.`;
};

// Format style guidance based on parameters
const formatStyleGuidance = (styleParameters) => {
  let guidance = "# Style Guidance\n\n";

  // Sentence structure
  if (styleParameters.sentence) {
    const sentenceLength = styleParameters.sentence.avg_length < 12 ? 'short' :
      styleParameters.sentence.avg_length < 20 ? 'moderate' : 'long';
    
    guidance += `## Sentence Structure\n`;
    guidance += `- Use predominantly ${sentenceLength} sentences (average ${Math.round(styleParameters.sentence.avg_length)} words per sentence)\n`;
    if (styleParameters.sentence.length_distribution) {
      guidance += `- Sentence variety: ${Math.round(styleParameters.sentence.length_distribution.short * 100)}% short, ${Math.round(styleParameters.sentence.length_distribution.medium * 100)}% medium, ${Math.round(styleParameters.sentence.length_distribution.long * 100)}% long\n`;
    }
    guidance += `- Complexity: ${styleParameters.sentence.complexity < 0.4 ? 'simple and direct' : styleParameters.sentence.complexity < 0.7 ? 'moderately complex' : 'complex with multiple clauses'}\n`;
    guidance += `- Question frequency: ${styleParameters.sentence.questions ? 'Include occasional questions' : 'Rarely use questions'}\n\n`;
  }

  // Vocabulary
  if (styleParameters.vocabulary) {
    guidance += `## Vocabulary\n`;
    guidance += `- Lexical diversity: ${styleParameters.vocabulary.diversity < 0.4 ? 'Limited - use repetition and simple words' : styleParameters.vocabulary.diversity < 0.6 ? 'Moderate - mix familiar words with occasional distinctive ones' : 'High - use varied, precise vocabulary'}\n`;
    guidance += `- Formality: ${styleParameters.vocabulary.formality === 'formal' ? 'Formal academic tone' : styleParameters.vocabulary.formality === 'neutral' ? 'Balanced, professional tone' : 'Conversational, casual tone'}\n`;
    
    if (styleParameters.vocabulary.avoid) {
      guidance += `- Avoid these terms: ${styleParameters.vocabulary.avoid.join(', ')}\n`;
    }
    if (styleParameters.vocabulary.prefer) {
      guidance += `- Preferred terms: ${styleParameters.vocabulary.prefer.join(', ')}\n`;
    }
    guidance += '\n';
  }

  // Narrative
  if (styleParameters.narrative) {
    guidance += `## Narrative Approach\n`;
    guidance += `- Point of view: ${styleParameters.narrative.pov === 'first_person' ? 'First person' : styleParameters.narrative.pov === 'second_person' ? 'Second person' : 'Third person'}\n`;
    guidance += `- Tense: ${styleParameters.narrative.tense === 'present' ? 'Present tense' : 'Past tense'}\n`;
    guidance += `- Description vs. action balance: ${styleParameters.narrative.description_heavy ? 'Favor rich description' : 'Favor action and plot movement'}\n\n`;
  }

  // Tone
  if (styleParameters.tone) {
    guidance += `## Tone\n`;
    if (styleParameters.tone.emotional && styleParameters.tone.emotional.length > 0) {
      guidance += `- Emotional tone: ${styleParameters.tone.emotional.join(', ')}\n`;
    }
    if (styleParameters.tone.formality) {
      guidance += `- Formality: ${styleParameters.tone.formality}\n`;
    }
    if (styleParameters.tone.humor) {
      guidance += `- Humor level: ${styleParameters.tone.humor === 'high' ? 'Include humor and wit' : styleParameters.tone.humor === 'medium' ? 'Occasional light humor' : 'Serious, minimal humor'}\n\n`;
    }
  }

  // Stylistic devices
  if (styleParameters.devices) {
    guidance += `## Stylistic Devices\n`;
    const devices = [];
    if (styleParameters.devices.metaphors) devices.push('metaphors');
    if (styleParameters.devices.similes) devices.push('similes');
    if (styleParameters.devices.alliteration) devices.push('alliteration');
    if (styleParameters.devices.repetition) devices.push('repetition');
    
    if (devices.length > 0) {
      guidance += `- Use these devices: ${devices.join(', ')}\n`;
    }
    if (styleParameters.devices.avoid) {
      guidance += `- Avoid these devices: ${styleParameters.devices.avoid.join(', ')}\n`;
    }
    guidance += '\n';
  }

  // Comparable authors
  if (styleParameters.comparable_authors && styleParameters.comparable_authors.length > 0) {
    guidance += `## Similar Authors\n`;
    guidance += `- Emulate the style of: ${styleParameters.comparable_authors.join(', ')}\n\n`;
  }

  // User comments
  if (styleParameters.user_comments) {
    guidance += `## Additional Notes\n`;
    guidance += styleParameters.user_comments + '\n\n';
  }

  return guidance;
};

// Helper to combine metrics from multiple analyses
const combineMetrics = (analyses) => {
  if (!analyses || analyses.length === 0) {
    return null;
  }

  // For sentence metrics
  const avgSentenceLength = analyses.reduce((sum, a) => sum + (a.sentence_metrics?.avg_length || 0), 0) / analyses.length;

  // Distribution calculations
  let shortTotal = 0, mediumTotal = 0, longTotal = 0;
  analyses.forEach(a => {
    if (a.sentence_metrics?.length_distribution) {
      shortTotal += a.sentence_metrics.length_distribution.short || 0;
      mediumTotal += a.sentence_metrics.length_distribution.medium || 0;
      longTotal += a.sentence_metrics.length_distribution.long || 0;
    }
  });

  // Average complexity
  const complexityScore = analyses.reduce((sum, a) => sum + (a.sentence_metrics?.complexity_score || 0), 0) / analyses.length;

  // Question frequency
  const questionFrequency = analyses.reduce((sum, a) => sum + (a.sentence_metrics?.question_frequency || 0), 0) / analyses.length;

  // Combine vocabulary metrics
  const lexicalDiversity = analyses.reduce((sum, a) => sum + (a.vocabulary_metrics?.lexical_diversity || 0), 0) / analyses.length;
  const formalityScore = analyses.reduce((sum, a) => sum + (a.vocabulary_metrics?.formality_score || 0), 0) / analyses.length;

  // Determine POV
  const povCounts = {};
  analyses.forEach(a => {
    const pov = a.narrative_characteristics?.pov;
    if (pov) {
      povCounts[pov] = (povCounts[pov] || 0) + 1;
    }
  });
  let dominantPov = "unknown";
  let maxCount = 0;
  Object.keys(povCounts).forEach(pov => {
    if (povCounts[pov] > maxCount) {
      dominantPov = pov;
      maxCount = povCounts[pov];
    }
  });

  // Determine tense
  const tenseCounts = {};
  analyses.forEach(a => {
    const tense = a.narrative_characteristics?.tense;
    if (tense) {
      tenseCounts[tense] = (tenseCounts[tense] || 0) + 1;
    }
  });
  let dominantTense = "unknown";
  maxCount = 0;
  Object.keys(tenseCounts).forEach(tense => {
    if (tenseCounts[tense] > maxCount) {
      dominantTense = tense;
      maxCount = tenseCounts[tense];
    }
  });

  // Calculate action to reflection ratio
  const actionRatio = analyses.reduce((sum, a) => sum + (a.narrative_characteristics?.action_to_reflection_ratio || 1), 0) / analyses.length;

  // Collect emotional tones
  const tones = new Set();
  analyses.forEach(a => {
    if (a.tone_attributes?.emotional_tone) {
      a.tone_attributes.emotional_tone.forEach(tone => tones.add(tone));
    }
  });

  // Determine formality level
  const formalityLevels = {};
  analyses.forEach(a => {
    const level = a.tone_attributes?.formality_level;
    if (level) {
      formalityLevels[level] = (formalityLevels[level] || 0) + 1;
    }
  });
  let dominantFormality = "neutral";
  maxCount = 0;
  Object.keys(formalityLevels).forEach(level => {
    if (formalityLevels[level] > maxCount) {
      dominantFormality = level;
      maxCount = formalityLevels[level];
    }
  });

  // Extract most frequent literary devices
  const deviceFrequencies = {
    metaphor: analyses.reduce((sum, a) => sum + (a.stylistic_devices?.metaphor_frequency || 0), 0) / analyses.length,
    simile: analyses.reduce((sum, a) => sum + (a.stylistic_devices?.simile_frequency || 0), 0) / analyses.length,
    alliteration: analyses.reduce((sum, a) => sum + (a.stylistic_devices?.alliteration_frequency || 0), 0) / analyses.length,
    repetition: analyses.reduce((sum, a) => sum + (a.stylistic_devices?.repetition_patterns || 0), 0) / analyses.length
  };

  // Collect authors
  const authors = new Set();
  analyses.forEach(a => {
    if (a.comparable_authors) {
      a.comparable_authors.forEach(author => authors.add(author));
    }
  });

  // Build the consolidated metrics
  return {
    sentence: {
      avg_length: avgSentenceLength,
      short: shortTotal / analyses.length,
      medium: mediumTotal / analyses.length,
      long: longTotal / analyses.length,
      complexity: complexityScore,
      questions: questionFrequency > 0.05
    },
    vocabulary: {
      diversity: lexicalDiversity,
      formality: formalityScore > 0.6 ? 'formal' : formalityScore > 0.4 ? 'neutral' : 'casual',
    },
    narrative: {
      pov: dominantPov,
      tense: dominantTense,
      description_heavy: actionRatio < 1,
      action_ratio: actionRatio
    },
    tone: {
      emotional: Array.from(tones),
      formality: dominantFormality,
      humor: "low" // Default, would be more sophisticated in real implementation
    },
    devices: {
      metaphors: deviceFrequencies.metaphor > 0.01,
      similes: deviceFrequencies.simile > 0.01,
      alliteration: deviceFrequencies.alliteration > 0.01,
      repetition: deviceFrequencies.repetition > 0.01
    },
    comparable_authors: Array.from(authors)
  };
};

// ======================================================
// STYLE ANALYSIS IMPLEMENTATION FUNCTIONS
// ======================================================

// Analyze writing sample with database access
const analyzeWritingSample = async (args) => {
  try {
    const { text, sampleId, saveSample, title, author, sampleType, tags, projectId } = args;

    // 1. Calculate all the metrics
    const sentenceMetrics = calculateSentenceMetrics(text);
    const vocabularyMetrics = calculateVocabularyMetrics(text);
    const narrativeCharacteristics = analyzeNarrativeCharacteristics(text);
    const stylisticDevices = analyzeStyleDevices(text);
    const toneAttributes = analyzeTone(text);

    // Generate a descriptive summary
    const descriptiveSummary = generateDescription(
      sentenceMetrics,
      vocabularyMetrics,
      narrativeCharacteristics,
      stylisticDevices,
      toneAttributes
    );

    // 2. If sampleId is provided, use it; otherwise create a new sample if saveSample is true
    let sample_id = sampleId;
    
    if (!sample_id && saveSample) {
      if (!title) {
        throw new Error("Title is required when saving a new sample");
      }

      // Create a new sample
      const { data: newSample, error: sampleError } = await supabase
        .from('writing_samples')
        .insert({
          title,
          content: text,
          author: author || null,
          sample_type: sampleType || null,
          tags: tags || [],
          project_id: projectId,
          excerpt: createExcerpt(text)
        })
        .select()
        .single();

      if (sampleError) {
        throw new Error(`Failed to save sample: ${sampleError.message}`);
      }

      console.error(`Created new sample with ID: ${newSample.id}`);
      sample_id = newSample.id;
    }

    // 3. Store the analysis if we have a sample_id
    let analysisResult = null;
    if (sample_id) {
      const { data: analysis, error: analysisError } = await supabase
        .from('style_analyses')
        .insert({
          sample_id,
          sentence_metrics: sentenceMetrics,
          vocabulary_metrics: vocabularyMetrics,
          narrative_characteristics: narrativeCharacteristics,
          stylistic_devices: stylisticDevices,
          tone_attributes: toneAttributes,
          descriptive_summary: descriptiveSummary,
          comparable_authors: [] // Would be populated by a more sophisticated algorithm
        })
        .select()
        .single();

      if (analysisError) {
        throw new Error(`Failed to save analysis: ${analysisError.message}`);
      }

      console.error(`Created style analysis with ID: ${analysis.id}`);
      analysisResult = analysis;
    }

    // 4. Return the analysis results
    return {
      sample_id,
      metrics: {
        sentence_metrics: sentenceMetrics,
        vocabulary_metrics: vocabularyMetrics,
        narrative_characteristics: narrativeCharacteristics,
        stylistic_devices: stylisticDevices,
        tone_attributes: toneAttributes
      },
      summary: descriptiveSummary
    };
  } catch (error) {
    console.error("Error in analyzeWritingSample:", error);
    throw new Error(`Failed to analyze writing sample: ${error.message}`);
  }
};

// Get style profile with database access
const getStyleProfile = async (args) => {
  try {
    const { profileId, includeExamples, includeStyleNotes } = args;

    // 1. Fetch the style profile
    const { data: profile, error: profileError } = await supabase
      .from('style_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch style profile: ${profileError.message}`);
    }

    if (!profile) {
      throw new Error(`Style profile with ID ${profileId} not found`);
    }

    // 2. Fetch related sample IDs
    const { data: profileSamples, error: samplesError } = await supabase
      .from('profile_samples')
      .select('sample_id')
      .eq('profile_id', profileId);

    if (samplesError) {
      throw new Error(`Failed to fetch profile samples: ${samplesError.message}`);
    }

    const sampleIds = profileSamples.map(ps => ps.sample_id);

    // 3. Fetch representative samples
    const { data: representativeSamples, error: repSamplesError } = await supabase
      .from('representative_samples')
      .select('*')
      .eq('profile_id', profileId);

    if (repSamplesError) {
      throw new Error(`Failed to fetch representative samples: ${repSamplesError.message}`);
    }

    // 4. If including examples, fetch sample excerpts
    let examples = [];
    if (includeExamples && sampleIds.length > 0) {
      const { data: samples, error: examplesError } = await supabase
        .from('writing_samples')
        .select('title, excerpt')
        .in('id', sampleIds)
        .limit(3); // Limit to 3 examples for brevity

      if (examplesError) {
        throw new Error(`Failed to fetch sample excerpts: ${examplesError.message}`);
      }

      examples = samples.map(s => ({
        title: s.title,
        excerpt: s.excerpt
      }));

      // Add representative samples if available
      if (representativeSamples && representativeSamples.length > 0) {
        representativeSamples.forEach(rs => {
          examples.push({
            title: rs.description || "Representative Sample",
            excerpt: rs.text_content
          });
        });
      }
    }

    // 5. Format the response
    const response = {
      profile: {
        id: profile.id,
        name: profile.name,
        description: profile.description,
        parameters: profile.style_parameters,
        genre: profile.genre || [],
        comparable_authors: profile.comparable_authors || [],
        user_comments: profile.user_comments
      }
    };

    // 6. Add formatted style guidance if requested
    if (includeStyleNotes) {
      response.style_guidance = formatStyleGuidance({
        ...profile.style_parameters,
        comparable_authors: profile.comparable_authors,
        user_comments: profile.user_comments
      });
    }

    // 7. Add examples if requested and available
    if (includeExamples && examples.length > 0) {
      response.examples = examples;
    }

    return response;
  } catch (error) {
    console.error("Error in getStyleProfile:", error);
    throw new Error(`Failed to retrieve style profile: ${error.message}`);
  }
};

// Create or update a style profile with database access
const createStyleProfile = async (args) => {
  try {
    const { 
      name, 
      description, 
      sampleIds, 
      projectId, 
      profileId,
      genre,
      comparableAuthors,
      userComments,
      representativeSamples,
      addToExisting
    } = args;

    // 1. Verify all sample IDs exist
    const { data: samples, error: samplesError } = await supabase
      .from('writing_samples')
      .select('id')
      .in('id', sampleIds);

    if (samplesError) {
      throw new Error(`Failed to verify samples: ${samplesError.message}`);
    }

    if (samples.length !== sampleIds.length) {
      throw new Error(`Some sample IDs do not exist. Found ${samples.length} of ${sampleIds.length} requested samples.`);
    }

    // 2. Fetch style analyses for all samples
    const { data: analyses, error: analysesError } = await supabase
      .from('style_analyses')
      .select('*')
      .in('sample_id', sampleIds);

    if (analysesError) {
      throw new Error(`Failed to fetch style analyses: ${analysesError.message}`);
    }

    if (analyses.length === 0) {
      throw new Error(`No style analyses found for the provided samples. Please analyze the samples first.`);
    }

    // 3. Combine the analyses to create a composite style profile
    const styleParameters = combineMetrics(analyses);

    // If updating an existing profile, we might need to merge with existing parameters
    if (profileId && addToExisting) {
      // Fetch existing profile
      const { data: existingProfile, error: profileError } = await supabase
        .from('style_profiles')
        .select('*')
        .eq('id', profileId)
        .single();
      
      if (profileError) {
        throw new Error(`Failed to fetch existing profile: ${profileError.message}`);
      }

      // Merge comparable authors if provided
      if (comparableAuthors && comparableAuthors.length > 0) {
        const existingAuthors = existingProfile.comparable_authors || [];
        styleParameters.comparable_authors = [...new Set([...existingAuthors, ...comparableAuthors])];
      }
    } else if (comparableAuthors && comparableAuthors.length > 0) {
      // Set comparable authors directly for new profiles
      styleParameters.comparable_authors = comparableAuthors;
    }

    // 4. Create or update the style profile
    let profile;
    if (profileId) {
      // Update existing profile
      const updateData = {
        name,
        description,
        style_parameters: styleParameters,
        updated_at: new Date().toISOString()
      };

      // Only add these fields if they're provided
      if (genre) updateData.genre = genre;
      if (userComments) updateData.user_comments = userComments;
      if (projectId) updateData.project_id = projectId;

      const { data: updatedProfile, error: updateError } = await supabase
        .from('style_profiles')
        .update(updateData)
        .eq('id', profileId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update style profile: ${updateError.message}`);
      }

      profile = updatedProfile;
      console.error(`Updated profile with ID: ${profile.id}`);

      // If not adding to existing, delete the old profile-sample associations
      if (!addToExisting) {
        await supabase
          .from('profile_samples')
          .delete()
          .eq('profile_id', profileId);
        
        console.error(`Deleted existing sample associations for profile: ${profile.id}`);
      }
    } else {
      // Create new profile
      const newProfileData = {
        name,
        description,
        style_parameters: styleParameters,
        project_id: projectId,
        genre: genre || [],
        comparable_authors: styleParameters.comparable_authors || [],
        user_comments: userComments
      };

      const { data: newProfile, error: createError } = await supabase
        .from('style_profiles')
        .insert(newProfileData)
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create style profile: ${createError.message}`);
      }

      profile = newProfile;
      console.error(`Created new profile with ID: ${profile.id}`);
    }

    // 5. Create profile-sample associations for the new samples
    const profileSamples = sampleIds.map(sampleId => ({
      profile_id: profile.id,
      sample_id: sampleId,
      weight: 1.0 // Default equal weight
    }));

    const { error: associationError } = await supabase
      .from('profile_samples')
      .insert(profileSamples);

    if (associationError) {
      throw new Error(`Failed to create profile-sample associations: ${associationError.message}`);
    }

    console.error(`Created ${profileSamples.length} sample associations for profile: ${profile.id}`);

    // 6. Create representative samples if provided
    if (representativeSamples && representativeSamples.length > 0) {
      const repSamples = representativeSamples.map(rs => ({
        profile_id: profile.id,
        text_content: rs.textContent,
        description: rs.description
      }));

      const { error: repSampleError } = await supabase
        .from('representative_samples')
        .insert(repSamples);

      if (repSampleError) {
        throw new Error(`Failed to create representative samples: ${repSampleError.message}`);
      }

      console.error(`Created ${repSamples.length} representative samples for profile: ${profile.id}`);
    }

    // 7. Return the created/updated profile
    return {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      parameters: styleParameters,
      sample_count: sampleIds.length,
      genre: genre || [],
      comparable_authors: styleParameters.comparable_authors || [],
      user_comments: userComments
    };
  } catch (error) {
    console.error("Error in createStyleProfile:", error);
    throw new Error(`Failed to create style profile: ${error.message}`);
  }
};

// Write in a specific style with database access
const writeInStyle = async (args) => {
  try {
    const { profileId, prompt, length, includeStyleNotes } = args;

    // 1. Fetch the style profile
    const { data: profile, error: profileError } = await supabase
      .from('style_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch style profile: ${profileError.message}`);
    }

    if (!profile) {
      throw new Error(`Style profile with ID ${profileId} not found`);
    }

    // 2. Fetch a couple of sample excerpts as examples if available
    const { data: profileSamples, error: pSamplesError } = await supabase
      .from('profile_samples')
      .select('sample_id')
      .eq('profile_id', profileId)
      .limit(2);

    if (pSamplesError) {
      throw new Error(`Failed to fetch profile samples: ${pSamplesError.message}`);
    }

    let examples = [];
    if (profileSamples.length > 0) {
      const sampleIds = profileSamples.map(ps => ps.sample_id);
      
      const { data: samples, error: samplesError } = await supabase
        .from('writing_samples')
        .select('title, excerpt')
        .in('id', sampleIds);
      
      if (samplesError) {
        throw new Error(`Failed to fetch sample excerpts: ${samplesError.message}`);
      }

      examples = samples.map(s => ({
        title: s.title,
        excerpt: s.excerpt
      }));
    }

    // 3. Fetch representative samples if available
    const { data: representativeSamples, error: repSamplesError } = await supabase
      .from('representative_samples')
      .select('*')
      .eq('profile_id', profileId)
      .limit(3);

    if (repSamplesError) {
      throw new Error(`Failed to fetch representative samples: ${repSamplesError.message}`);
    }

    if (representativeSamples && representativeSamples.length > 0) {
      representativeSamples.forEach(rs => {
        examples.push({
          title: rs.description || "Representative Sample",
          excerpt: rs.text_content
        });
      });
    }

    // 4. Format the style guidance
    const styleGuidance = includeStyleNotes ? formatStyleGuidance({
      ...profile.style_parameters,
      comparable_authors: profile.comparable_authors,
      user_comments: profile.user_comments
    }) : "";

    // 5. Prepare the writing instructions
    const lengthInstruction = length ? `Write approximately ${length} words.` : "";

    return {
      profile_name: profile.name,
      style_guidance: styleGuidance,
      writing_prompt: prompt,
      length_instruction: lengthInstruction,
      examples: examples,
      parameters: profile.style_parameters
    };
  } catch (error) {
    console.error("Error in writeInStyle:", error);
    throw new Error(`Failed to prepare writing instructions: ${error.message}`);
  }
};

// ======================================================
// NARRATIVE STRUCTURE IMPLEMENTATION FUNCTIONS
// ======================================================

/**
 * Retrieves a character's complete journey of events in sequence order
 * 
 * @param {object} args - The function arguments
 * @returns {object} Character journey with events and metadata
 */
async function getCharacterJourney(args) {
  try {
    const { character_id, story_id } = args;

    let query = supabase
      .from('character_events')
      .select(`
        id,
        importance,
        character_sequence_number,
        experience_type,
        notes,
        events(
          id, 
          title, 
          description, 
          sequence_number,
          chronological_time,
          visible,
          story_id
        ),
        characters(
          id,
          name,
          role
        )
      `)
      .eq('character_id', character_id)
      .order('character_sequence_number', { ascending: true });
    
    if (story_id) {
      query = query.eq('events.story_id', story_id);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Format response for better usability
    const character = data[0]?.characters;
    const events = data.map(item => ({
      id: item.events.id,
      title: item.events.title,
      description: item.events.description,
      sequence_number: item.events.sequence_number,
      chronological_time: item.events.chronological_time,
      visible: item.events.visible,
      importance: item.importance,
      character_sequence_number: item.character_sequence_number,
      experience_type: item.experience_type || 'unspecified',
      notes: item.notes || ''
    }));
    
    return {
      character,
      journey: events,
      event_count: events.length
    };
  } catch (error) {
    console.error('Error in get_character_journey:', error);
    throw error;
  }
}

/**
 * Compare multiple characters' journeys, highlighting shared events
 * 
 * @param {object} args - The function arguments
 * @returns {object} Comparison of character journeys
 */
async function compareCharacterJourneys(args) {
  try {
    const { character_ids, story_id } = args;
    
    // Validate input
    if (!Array.isArray(character_ids) || character_ids.length < 2) {
      throw new Error('At least two character IDs are required for comparison');
    }
    
    // Get all character journeys
    const characterJourneys = await Promise.all(
      character_ids.map(id => getCharacterJourney({ character_id: id, story_id }))
    );
    
    // Find shared events
    const allEvents = characterJourneys.flatMap(journey => journey.journey);
    const eventMap = {};
    
    // Group events by ID and count occurrences
    allEvents.forEach(event => {
      if (!eventMap[event.id]) {
        eventMap[event.id] = {
          event,
          characters: [],
          sharedCount: 0
        };
      }
      
      const currentChar = characterJourneys.find(
        j => j.journey.some(e => e.id === event.id)
      ).character;
      
      eventMap[event.id].characters.push({
        id: currentChar.id,
        name: currentChar.name,
        importance: event.importance,
        experience_type: event.experience_type
      });
      
      eventMap[event.id].sharedCount++;
    });
    
    // Convert to array and filter for shared events
    const sharedEvents = Object.values(eventMap)
      .filter(item => item.sharedCount > 1)
      .sort((a, b) => a.event.sequence_number - b.event.sequence_number);
    
    // Create character-specific journeys
    const journeys = characterJourneys.map(journey => ({
      character: journey.character,
      event_count: journey.event_count,
      events: journey.journey
    }));
    
    return {
      journeys,
      shared_events: sharedEvents,
      shared_event_count: sharedEvents.length
    };
  } catch (error) {
    console.error('Error in compare_character_journeys:', error);
    throw error;
  }
}

/**
 * Safely updates an event's sequence number, maintaining dependencies
 * 
 * @param {object} args - The function arguments
 * @returns {object} Updated event data
 */
async function updateEventSequence(args) {
  try {
    const { event_id, new_sequence_number } = args;
    
    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();
    
    if (eventError) throw eventError;
    if (!event) throw new Error(`Event with ID ${event_id} not found`);
    
    // Get dependencies to validate new position
    const { data: dependencies, error: depError } = await supabase
      .from('event_dependencies')
      .select(`
        id,
        predecessor_event_id,
        successor_event_id,
        dependency_type,
        strength,
        events_predecessor:predecessor_event_id(sequence_number),
        events_successor:successor_event_id(sequence_number)
      `)
      .or(`predecessor_event_id.eq.${event_id},successor_event_id.eq.${event_id}`);
    
    if (depError) throw depError;
    
    // Check for dependency violations
    const violations = [];
    dependencies.forEach(dep => {
      if (dep.predecessor_event_id === event_id) {
        // This event is a predecessor - check if new position would violate
        if (new_sequence_number > dep.events_successor.sequence_number) {
          violations.push({
            type: 'successor_before_predecessor',
            dependency_id: dep.id,
            successor_event_id: dep.successor_event_id,
            successor_sequence: dep.events_successor.sequence_number
          });
        }
      } else {
        // This event is a successor - check if new position would violate
        if (new_sequence_number < dep.events_predecessor.sequence_number) {
          violations.push({
            type: 'predecessor_after_successor',
            dependency_id: dep.id,
            predecessor_event_id: dep.predecessor_event_id,
            predecessor_sequence: dep.events_predecessor.sequence_number
          });
        }
      }
    });
    
    if (violations.length > 0) {
      return {
        success: false,
        violations,
        message: 'Cannot update sequence number due to dependency violations'
      };
    }
    
    // Update the sequence number
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({ sequence_number: new_sequence_number })
      .eq('id', event_id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    return {
      success: true,
      previous_sequence_number: event.sequence_number,
      event: updatedEvent
    };
  } catch (error) {
    console.error('Error in update_event_sequence:', error);
    throw error;
  }
}

/**
 * Normalizes event sequence numbers to be evenly distributed
 * 
 * @param {object} args - The function arguments
 * @returns {object} Results of normalization
 */
async function normalizeEventSequence(args) {
  try {
    const { story_id, start_value = 10, interval = 10 } = args;
    
    // Get all events for the story, ordered by current sequence
    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, sequence_number')
      .eq('story_id', story_id)
      .order('sequence_number', { ascending: true });
    
    if (error) throw error;
    
    if (events.length === 0) {
      return {
        success: true,
        message: 'No events found for normalization',
        events_normalized: 0
      };
    }
    
    // Generate new sequence numbers
    const updates = events.map((event, index) => ({
      id: event.id,
      old_sequence: event.sequence_number,
      new_sequence: start_value + (index * interval)
    }));
    
    // Update events in batch
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('events')
        .update({ sequence_number: update.new_sequence })
        .eq('id', update.id);
      
      if (updateError) throw updateError;
    }
    
    return {
      success: true,
      message: `Normalized sequence numbers for ${events.length} events`,
      events_normalized: events.length,
      first_event: updates[0],
      last_event: updates[updates.length - 1]
    };
  } catch (error) {
    console.error('Error in normalize_event_sequence:', error);
    throw error;
  }
}

/**
 * Creates a new story event with optional dependencies
 * 
 * @param {object} args - The function arguments
 * @returns {object} Created event with dependencies
 */
async function createStoryEvent(args) {
  try {
    const { event_data, dependency_data = null } = args;
    
    // Validate required fields
    if (!event_data.title || !event_data.story_id) {
      throw new Error('Event title and story_id are required');
    }
    
    // Fill in default values
    const eventToCreate = {
      title: event_data.title,
      description: event_data.description || '',
      story_id: event_data.story_id,
      visible: event_data.visible !== undefined ? event_data.visible : true,
      sequence_number: event_data.sequence_number || 999999 // High number by default
    };
    
    if (event_data.chronological_time) {
      eventToCreate.chronological_time = event_data.chronological_time;
    }
    
    if (event_data.relative_time_offset) {
      eventToCreate.relative_time_offset = event_data.relative_time_offset;
    }
    
    // Create the event
    const { data: createdEvent, error } = await supabase
      .from('events')
      .insert(eventToCreate)
      .select()
      .single();
    
    if (error) throw error;
    
    // Handle dependencies if provided
    const createdDependencies = [];
    if (dependency_data) {
      // Add predecessor dependencies
      if (dependency_data.predecessors && Array.isArray(dependency_data.predecessors)) {
        for (const pred of dependency_data.predecessors) {
          const { data, error: depError } = await supabase
            .from('event_dependencies')
            .insert({
              predecessor_event_id: pred.event_id,
              successor_event_id: createdEvent.id,
              dependency_type: pred.dependency_type || 'chronological',
              strength: pred.strength || 5
            })
            .select();
          
          if (depError) throw depError;
          createdDependencies.push(data[0]);
        }
      }
      
      // Add successor dependencies
      if (dependency_data.successors && Array.isArray(dependency_data.successors)) {
        for (const succ of dependency_data.successors) {
          const { data, error: depError } = await supabase
            .from('event_dependencies')
            .insert({
              predecessor_event_id: createdEvent.id,
              successor_event_id: succ.event_id,
              dependency_type: succ.dependency_type || 'chronological',
              strength: succ.strength || 5
            })
            .select();
          
          if (depError) throw depError;
          createdDependencies.push(data[0]);
        }
      }
    }
    
    return {
      success: true,
      event: createdEvent,
      dependencies: createdDependencies
    };
  } catch (error) {
    console.error('Error in create_story_event:', error);
    throw error;
  }
}

/**
 * Adds an event with multiple dependencies and proper positioning
 * 
 * @param {object} args - The function arguments
 * @returns {object} Created event with dependencies
 */
async function addEventWithDependencies(args) {
  try {
    const { event_data, predecessors = [], successors = [] } = args;
    
    // Calculate appropriate sequence number based on dependencies
    let sequence_number = null;
    
    if (predecessors.length > 0 && successors.length > 0) {
      // Position between predecessors and successors
      const { data: predEvents, error: predError } = await supabase
        .from('events')
        .select('sequence_number')
        .in('id', predecessors);
      
      if (predError) throw predError;
      
      const { data: succEvents, error: succError } = await supabase
        .from('events')
        .select('sequence_number')
        .in('id', successors);
      
      if (succError) throw succError;
      
      const maxPredSequence = Math.max(...predEvents.map(e => e.sequence_number));
      const minSuccSequence = Math.min(...succEvents.map(e => e.sequence_number));
      
      sequence_number = maxPredSequence + ((minSuccSequence - maxPredSequence) / 2);
    } 
    else if (predecessors.length > 0) {
      // Position after predecessors
      const { data: predEvents, error: predError } = await supabase
        .from('events')
        .select('sequence_number')
        .in('id', predecessors);
      
      if (predError) throw predError;
      
      const maxPredSequence = Math.max(...predEvents.map(e => e.sequence_number));
      sequence_number = maxPredSequence + 10;
    } 
    else if (successors.length > 0) {
      // Position before successors
      const { data: succEvents, error: succError } = await supabase
        .from('events')
        .select('sequence_number')
        .in('id', successors);
      
      if (succError) throw succError;
      
      const minSuccSequence = Math.min(...succEvents.map(e => e.sequence_number));
      sequence_number = Math.max(1, minSuccSequence - 10);
    }
    
    // Set calculated sequence number if found
    if (sequence_number !== null) {
      event_data.sequence_number = sequence_number;
    }
    
    // Prepare dependency data
    const dependency_data = {
      predecessors: predecessors.map(id => ({
        event_id: id,
        dependency_type: 'chronological'
      })),
      successors: successors.map(id => ({
        event_id: id,
        dependency_type: 'chronological'
      }))
    };
    
    // Create the event with dependencies
    return await createStoryEvent({ event_data, dependency_data });
  } catch (error) {
    console.error('Error in add_event_with_dependencies:', error);
    throw error;
  }
}

/**
 * Adds an event to a character's journey
 * 
 * @param {object} args - The function arguments
 * @returns {object} Created event and character relationship
 */
async function addCharacterEvent(args) {
  try {
    const { character_id, event_data, journey_position = null } = args;
    
    // First create the event
    const result = await createStoryEvent({ event_data });
    if (!result.success) throw new Error('Failed to create event');
    
    const event = result.event;
    
    // Determine character_sequence_number if not provided
    let position = journey_position;
    if (position === null) {
      const { data, error } = await supabase
        .from('character_events')
        .select('character_sequence_number')
        .eq('character_id', character_id)
        .order('character_sequence_number', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      position = data.length > 0 
        ? data[0].character_sequence_number + 10 
        : 10;
    }
    
    // Create character-event relationship
    const charEventData = {
      character_id,
      event_id: event.id,
      importance: event_data.importance || 5,
      character_sequence_number: position,
      experience_type: event_data.experience_type || 'active'
    };
    
    if (event_data.notes) {
      charEventData.notes = event_data.notes;
    }
    
    const { data: charEvent, error } = await supabase
      .from('character_events')
      .insert(charEventData)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      event,
      character_event: charEvent
    };
  } catch (error) {
    console.error('Error in add_character_event:', error);
    throw error;
  }
}

/**
 * Find events shared between multiple characters
 * 
 * @param {object} args - The function arguments
 * @returns {object} Shared events with character context
 */
async function findSharedEvents(args) {
  try {
    const { character_ids, story_id = null } = args;
    
    if (!Array.isArray(character_ids) || character_ids.length === 0) {
      throw new Error('At least one character ID is required');
    }
    
    // Get all character-event relationships for these characters
    let query = supabase
      .from('character_events')
      .select(`
        id,
        character_id,
        event_id,
        importance,
        experience_type,
        characters(name),
        events(
          id,
          title,
          description,
          sequence_number,
          story_id,
          chronological_time
        )
      `)
      .in('character_id', character_ids);
    
    if (story_id) {
      query = query.eq('events.story_id', story_id);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Group by event
    const eventMap = {};
    data.forEach(item => {
      if (!eventMap[item.event_id]) {
        eventMap[item.event_id] = {
          event: item.events,
          characters: [],
          shared_by: 0
        };
      }
      
      eventMap[item.event_id].characters.push({
        id: item.character_id,
        name: item.characters.name,
        importance: item.importance,
        experience_type: item.experience_type
      });
      
      eventMap[item.event_id].shared_by++;
    });
    
    // Convert to array and add metadata
    const events = Object.values(eventMap)
      .map(item => ({
        ...item.event,
        characters: item.characters,
        shared_by: item.shared_by
      }))
      .sort((a, b) => a.sequence_number - b.sequence_number);
    
    return {
      events,
      total_events: events.length,
      fully_shared_events: events.filter(e => e.shared_by === character_ids.length).length
    };
  } catch (error) {
    console.error('Error in find_shared_events:', error);
    throw error;
  }
}

/**
 * Creates a scene and optionally a corresponding event
 * 
 * @param {object} args - The function arguments
 * @returns {object} Created scene and event
 */
async function addSceneWithEvents(args) {
  try {
    const { scene_data, event_data = null } = args;
    
    // Validate required fields for scene
    if (!scene_data.title || !scene_data.story_id) {
      throw new Error('Scene title and story_id are required');
    }
    
    let event;
    
    // Create or use existing event
    if (event_data === null) {
      // Create a new event based on scene data
      const newEventData = {
        title: `Event: ${scene_data.title}`,
        description: scene_data.description || '',
        story_id: scene_data.story_id,
        sequence_number: scene_data.sequence_number,
        visible: true
      };
      
      const result = await createStoryEvent({ event_data: newEventData });
      event = result.event;
    } else if (event_data.id) {
      // Use existing event
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', event_data.id)
        .single();
      
      if (error) throw error;
      event = data;
    } else {
      // Create new event with provided data
      const newEventData = {
        ...event_data,
        story_id: scene_data.story_id // Ensure story_id is set
      };
      const result = await createStoryEvent({ event_data: newEventData });
      event = result.event;
    }
    
    // Create the scene
    const sceneToCreate = {
      title: scene_data.title,
      description: scene_data.description || '',
      content: scene_data.content || '',
      event_id: event.id,
      story_id: scene_data.story_id
    };
    
    const { data: scene, error } = await supabase
      .from('scenes')
      .insert(sceneToCreate)
      .select()
      .single();
    
    if (error) throw error;
    
    // Handle characters in scene if provided
    const scene_characters = [];
    if (scene_data.characters && Array.isArray(scene_data.characters)) {
      for (const char of scene_data.characters) {
        const { data, error: charError } = await supabase
          .from('scene_characters')
          .insert({
            scene_id: scene.id,
            character_id: char.id,
            importance: char.importance || 'secondary'
          })
          .select();
        
        if (charError) throw charError;
        scene_characters.push(data[0]);
        
        // Also link the character to the event if not already linked
        const { data: existing, error: existingError } = await supabase
          .from('character_events')
          .select('id')
          .eq('character_id', char.id)
          .eq('event_id', event.id);
        
        if (existingError) throw existingError;
        
        if (existing.length === 0) {
          await supabase
            .from('character_events')
            .insert({
              character_id: char.id,
              event_id: event.id,
              importance: char.importance === 'primary' ? 8 : 5,
              experience_type: 'active'
            });
        }
      }
    }
    
    // Handle locations in scene if provided
    const scene_locations = [];
    if (scene_data.locations && Array.isArray(scene_data.locations)) {
      for (const loc of scene_data.locations) {
        const { data, error: locError } = await supabase
          .from('scene_locations')
          .insert({
            scene_id: scene.id,
            location_id: loc.id
          })
          .select();
        
        if (locError) throw locError;
        scene_locations.push(data[0]);
      }
    }
    
    return {
      success: true,
      scene,
      event,
      scene_characters,
      scene_locations
    };
  } catch (error) {
    console.error('Error in add_scene_with_events:', error);
    throw error;
  }
}

/**
 * Generates a visual representation of events and their relationships
 * 
 * @param {object} args - The function arguments
 * @returns {object} Visualization data in requested format
 */
async function visualizeTimeline(args) {
  try {
    const { story_id, format = "react-flow" } = args;
    
    // Get all events for the story
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('story_id', story_id)
      .order('sequence_number', { ascending: true });
    
    if (eventError) throw eventError;
    
    // Get all dependencies
    const { data: dependencies, error: depError } = await supabase
      .from('event_dependencies')
      .select('*')
      .in('predecessor_event_id', events.map(e => e.id))
      .in('successor_event_id', events.map(e => e.id));
    
    if (depError) throw depError;
    
    // Get character involvement
    const { data: characterEvents, error: charError } = await supabase
      .from('character_events')
      .select(`
        id,
        character_id,
        event_id,
        importance,
        characters(id, name)
      `)
      .in('event_id', events.map(e => e.id));
    
    if (charError) throw charError;
    
    // Group character involvement by event
    const charactersByEvent = {};
    characterEvents.forEach(ce => {
      if (!charactersByEvent[ce.event_id]) {
        charactersByEvent[ce.event_id] = [];
      }
      charactersByEvent[ce.event_id].push({
        id: ce.character_id,
        name: ce.characters.name,
        importance: ce.importance
      });
    });
    
    // Format for react-flow
    if (format === "react-flow") {
      const nodes = events.map((event, index) => ({
        id: event.id,
        type: 'event',
        position: { x: index * 250, y: event.sequence_number * 10 },
        data: {
          label: event.title,
          description: event.description,
          sequence: event.sequence_number,
          chronological_time: event.chronological_time,
          visible: event.visible,
          characters: charactersByEvent[event.id] || []
        }
      }));
      
      const edges = dependencies.map(dep => ({
        id: dep.id,
        source: dep.predecessor_event_id,
        target: dep.successor_event_id,
        type: 'custom',
        animated: true,
        style: { stroke: getDepTypeColor(dep.dependency_type) },
        label: dep.dependency_type,
        data: {
          type: dep.dependency_type,
          strength: dep.strength
        }
      }));
      
      return {
        type: 'react-flow',
        elements: {
          nodes,
          edges
        }
      };
    }
    
    // Format for timeline
    if (format === "timeline") {
      const timelineItems = events.map(event => ({
        id: event.id,
        title: event.title,
        content: event.description,
        start: event.chronological_time 
          ? new Date(event.chronological_time).toISOString() 
          : undefined,
        group: 'events',
        characters: charactersByEvent[event.id] || []
      }));
      
      return {
        type: 'timeline',
        items: timelineItems
      };
    }
    
    // Default format - just return structured data
    return {
      type: 'structured',
      events: events.map(event => ({
        ...event,
        characters: charactersByEvent[event.id] || []
      })),
      dependencies
    };
  } catch (error) {
    console.error('Error in visualize_timeline:', error);
    throw error;
  }
}

// Helper function for visualization
function getDepTypeColor(type) {
  const colors = {
    causal: '#FF5733',
    prerequisite: '#33A8FF',
    thematic: '#8C33FF',
    chronological: '#33FF57'
  };
  return colors[type] || '#AAAAAA';
}

/**
 * Analyzes how an event impacts characters and the story
 * 
 * @param {object} args - The function arguments
 * @returns {object} Analysis of event's impact
 */
async function analyzeEventImpact(args) {
  try {
    const { event_id } = args;
    
    // Get the event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();
    
    if (eventError) throw eventError;
    
    // Get characters affected by this event
    const { data: characterEvents, error: charError } = await supabase
      .from('character_events')
      .select(`
        id,
        importance,
        experience_type,
        characters(id, name, role)
      `)
      .eq('event_id', event_id);
    
    if (charError) throw charError;
    
    // Get dependencies where this event is involved
    const { data: dependencies, error: depError } = await supabase
      .from('event_dependencies')
      .select(`
        id,
        predecessor_event_id,
        successor_event_id,
        dependency_type,
        strength,
        events_predecessor:predecessor_event_id(title),
        events_successor:successor_event_id(title)
      `)
      .or(`predecessor_event_id.eq.${event_id},successor_event_id.eq.${event_id}`);
    
    if (depError) throw depError;
    
    // Format dependencies for clarity
    const causes = [];
    const effects = [];
    
    dependencies.forEach(dep => {
      if (dep.predecessor_event_id === event_id) {
        // This event causes something
        effects.push({
          id: dep.successor_event_id,
          title: dep.events_successor.title,
          relationship: dep.dependency_type,
          strength: dep.strength
        });
      } else {
        // This event is caused by something
        causes.push({
          id: dep.predecessor_event_id,
          title: dep.events_predecessor.title,
          relationship: dep.dependency_type,
          strength: dep.strength
        });
      }
    });
    
    // Get scenes that portray this event
    const { data: scenes, error: sceneError } = await supabase
      .from('scenes')
      .select('id, title')
      .eq('event_id', event_id);
    
    if (sceneError) throw sceneError;
    
    // Format character impact by importance
    const characters = {
      primary: characterEvents.filter(ce => ce.importance >= 8).map(ce => ce.characters),
      secondary: characterEvents.filter(ce => ce.importance >= 5 && ce.importance < 8).map(ce => ce.characters),
      tertiary: characterEvents.filter(ce => ce.importance < 5).map(ce => ce.characters)
    };
    
    return {
      event,
      impact: {
        character_count: characterEvents.length,
        cause_count: causes.length,
        effect_count: effects.length,
        scene_count: scenes.length,
        significance: calculateSignificance(causes, effects, characterEvents)
      },
      characters,
      causes,
      effects,
      scenes
    };
  } catch (error) {
    console.error('Error in analyze_event_impact:', error);
    throw error;
  }
}

// Helper function to calculate significance score
function calculateSignificance(causes, effects, characterEvents) {
  // Calculate based on number of connections and character importance
  const connectionFactor = (causes.length + effects.length) * 2;
  const characterFactor = characterEvents.reduce((sum, ce) => sum + ce.importance, 0);
  
  return Math.min(10, Math.round((connectionFactor + characterFactor) / 5));
}

/**
 * Detects logical inconsistencies in event dependencies
 * 
 * @param {object} args - The function arguments
 * @returns {object} Detected conflicts and issues
 */
async function detectDependencyConflicts(args) {
  try {
    const { story_id } = args;
    
    // Get all events for the story
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('id, title, sequence_number')
      .eq('story_id', story_id)
      .order('sequence_number', { ascending: true });
    
    if (eventError) throw eventError;
    
    // Get all dependencies
    const { data: dependencies, error: depError } = await supabase
      .from('event_dependencies')
      .select(`
        id,
        predecessor_event_id,
        successor_event_id,
        dependency_type,
        events_predecessor:predecessor_event_id(id, title, sequence_number),
        events_successor:successor_event_id(id, title, sequence_number)
      `)
      .in('predecessor_event_id', events.map(e => e.id))
      .in('successor_event_id', events.map(e => e.id));
    
    if (depError) throw depError;
    
    // Check for sequence conflicts
    const sequenceConflicts = [];
    dependencies.forEach(dep => {
      if (dep.events_predecessor.sequence_number > dep.events_successor.sequence_number) {
        sequenceConflicts.push({
          dependency_id: dep.id,
          predecessor: {
            id: dep.predecessor_event_id,
            title: dep.events_predecessor.title,
            sequence_number: dep.events_predecessor.sequence_number
          },
          successor: {
            id: dep.successor_event_id,
            title: dep.events_successor.title,
            sequence_number: dep.events_successor.sequence_number
          },
          conflict_type: 'sequence_order',
          message: 'Predecessor appears after successor in sequence order'
        });
      }
    });
    
    // Check for circular dependencies
    const circularConflicts = findCircularDependencies(events, dependencies);
    
    // Check for orphaned events (no connections)
    const eventConnections = {};
    events.forEach(e => {
      eventConnections[e.id] = { as_predecessor: 0, as_successor: 0 };
    });
    
    dependencies.forEach(dep => {
      if (eventConnections[dep.predecessor_event_id]) {
        eventConnections[dep.predecessor_event_id].as_predecessor++;
      }
      if (eventConnections[dep.successor_event_id]) {
        eventConnections[dep.successor_event_id].as_successor++;
      }
    });
    
    const orphanedEvents = [];
    Object.entries(eventConnections).forEach(([eventId, connections]) => {
      if (connections.as_predecessor === 0 && connections.as_successor === 0) {
        const event = events.find(e => e.id === eventId);
        orphanedEvents.push({
          id: eventId,
          title: event.title,
          issue_type: 'orphaned',
          message: 'Event has no connections to other events'
        });
      }
    });
    
    return {
      story_id,
      events_analyzed: events.length,
      dependencies_analyzed: dependencies.length,
      has_conflicts: sequenceConflicts.length > 0 || circularConflicts.length > 0,
      issues: {
        sequence_conflicts: sequenceConflicts,
        circular_dependencies: circularConflicts,
        orphaned_events: orphanedEvents
      }
    };
  } catch (error) {
    console.error('Error in detect_dependency_conflicts:', error);
    throw error;
  }
}

// Helper function to find circular dependencies
function findCircularDependencies(events, dependencies) {
  const conflicts = [];
  const graph = {};
  
  // Build dependency graph
  events.forEach(event => {
    graph[event.id] = [];
  });
  
  dependencies.forEach(dep => {
    if (graph[dep.predecessor_event_id]) {
      graph[dep.predecessor_event_id].push(dep.successor_event_id);
    }
  });
  
  // Check each event for cycles
  events.forEach(startEvent => {
    const visited = {};
    const path = [];
    
    function dfs(currentId) {
      if (path.includes(currentId)) {
        // Found a cycle
        const cycleStart = path.indexOf(currentId);
        const cycle = path.slice(cycleStart).concat(currentId);
        
        conflicts.push({
          events_involved: cycle.map(id => ({
            id,
            title: events.find(e => e.id === id)?.title
          })),
          conflict_type: 'circular_dependency',
          message: 'These events form a circular dependency chain'
        });
        return;
      }
      
      if (visited[currentId]) return;
      visited[currentId] = true;
      path.push(currentId);
      
      graph[currentId].forEach(successorId => {
        dfs(successorId);
      });
      
      path.pop();
    }
    
    dfs(startEvent.id);
  });
  
  return conflicts;
}

/**
 * Suggests potential missing events in a story
 * 
 * @param {object} args - The function arguments
 * @returns {object} Suggested events to fill gaps
 */
async function suggestMissingEvents(args) {
  try {
    const { story_id } = args;
    
    // Get existing events and their dependencies
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('id, title, description, sequence_number')
      .eq('story_id', story_id)
      .order('sequence_number', { ascending: true });
    
    if (eventError) throw eventError;
    
    // Get dependencies
    const { data: dependencies, error: depError } = await supabase
      .from('event_dependencies')
      .select(`
        id,
        predecessor_event_id,
        successor_event_id,
        dependency_type,
        strength
      `)
      .in('predecessor_event_id', events.map(e => e.id))
      .in('successor_event_id', events.map(e => e.id));
    
    if (depError) throw depError;
    
    // Get character involvement
    const { data: characterEvents, error: charError } = await supabase
      .from('character_events')
      .select(`
        character_id,
        event_id,
        characters(id, name, role)
      `)
      .in('event_id', events.map(e => e.id));
    
    if (charError) throw charError;
    
    // Group character involvement by character
    const characterJourneys = {};
    characterEvents.forEach(ce => {
      if (!characterJourneys[ce.character_id]) {
        characterJourneys[ce.character_id] = {
          character: ce.characters,
          events: []
        };
      }
      
      characterJourneys[ce.character_id].events.push({
        id: ce.event_id,
        event: events.find(e => e.id === ce.event_id)
      });
    });
    
    const suggestions = [];
    
    // Check for large sequence gaps
    const sequenceGaps = [];
    for (let i = 0; i < events.length - 1; i++) {
      const gap = events[i+1].sequence_number - events[i].sequence_number;
      if (gap > 50) {
        sequenceGaps.push({
          position: {
            before: {
              id: events[i+1].id,
              title: events[i+1].title,
              sequence_number: events[i+1].sequence_number
            },
            after: {
              id: events[i].id,
              title: events[i].title,
              sequence_number: events[i].sequence_number
            }
          },
          gap_size: gap
        });
      }
    }
    
    if (sequenceGaps.length > 0) {
      suggestions.push({
        type: 'sequence_gaps',
        message: 'Large gaps detected in event sequence',
        gaps: sequenceGaps
      });
    }
    
    // Check for long causal chains with few events
    const causalChains = findCausalChains(events, dependencies);
    const longCausalJumps = causalChains.filter(chain => 
      chain.events.length === 2 && 
      chain.dependency_type === 'causal' &&
      chain.strength >= 8
    );
    
    if (longCausalJumps.length > 0) {
      suggestions.push({
        type: 'causal_jumps',
        message: 'Direct causal jumps that might benefit from intermediate events',
        chains: longCausalJumps
      });
    }
    
    // Check for character journey gaps
    const characterGaps = [];
    Object.entries(characterJourneys).forEach(([charId, journey]) => {
      if (journey.events.length >= 2) {
        journey.events.sort((a, b) => 
          a.event.sequence_number - b.event.sequence_number
        );
        
        for (let i = 0; i < journey.events.length - 1; i++) {
          const gap = journey.events[i+1].event.sequence_number - 
                     journey.events[i].event.sequence_number;
          
          if (gap > 50) {
            characterGaps.push({
              character: journey.character,
              position: {
                before: {
                  id: journey.events[i+1].id,
                  title: journey.events[i+1].event.title,
                  sequence_number: journey.events[i+1].event.sequence_number
                },
                after: {
                  id: journey.events[i].id,
                  title: journey.events[i].event.title,
                  sequence_number: journey.events[i].event.sequence_number
                }
              },
              gap_size: gap
            });
          }
        }
      }
    });
    
    if (characterGaps.length > 0) {
      suggestions.push({
        type: 'character_journey_gaps',
        message: 'Gaps detected in character journeys',
        gaps: characterGaps
      });
    }
    
    return {
      story_id,
      events_analyzed: events.length,
      has_suggestions: suggestions.length > 0,
      suggestions
    };
  } catch (error) {
    console.error('Error in suggest_missing_events:', error);
    throw error;
  }
}

// Helper function to find causal chains
function findCausalChains(events, dependencies) {
  const chains = [];
  const causalDeps = dependencies.filter(dep => 
    dep.dependency_type === 'causal'
  );
  
  causalDeps.forEach(dep => {
    const predecessor = events.find(e => e.id === dep.predecessor_event_id);
    const successor = events.find(e => e.id === dep.successor_event_id);
    
    chains.push({
      dependency_type: dep.dependency_type,
      strength: dep.strength,
      events: [predecessor, successor]
    });
  });
  
  return chains;
}

/**
 * Master function for analyzing a story and populating the database
 * 
 * @param {object} args - The function arguments
 * @returns {object} Comprehensive story analysis
 */
async function analyzeStory(args) {
  try {
    const { story_text, story_title, options = {} } = args;
    
    // Default options
    const settings = {
      create_project: true,
      interactive_mode: true,
      resolution_threshold: 0.7,
      extract_characters: true,
      extract_locations: true,
      extract_events: true,
      extract_relationships: true,
      ...options
    };
    
    console.error(`Beginning analysis of "${story_title}"...`);
    
    // Create or get story
    let story_id;
    if (settings.create_project) {
      // Create new story
      const { data: story, error } = await supabase
        .from('stories')
        .insert({
          title: story_title,
          name: story_title,
          description: 'Automatically created from story analysis',
          story_world_id: settings.story_world_id || null, // Use existing or null
          status: 'Draft',
          word_count: countWords(story_text)
        })
        .select()
        .single();
      
      if (error) throw error;
      story_id = story.id;
      
      console.error(`Created new story with ID: ${story_id}`);
    } else {
      // Use existing story
      if (!settings.story_id) {
        throw new Error('Either create_project must be true or story_id must be provided');
      }
      story_id = settings.story_id;
      console.error(`Using existing story with ID: ${story_id}`);
    }
    
    // Begin extraction process
    const results = {
      story_id,
      story_title,
      extracted: {
        characters: [],
        locations: [],
        events: [],
        scenes: [],
        dependencies: []
      }
    };
    
    // Process sections
    const sections = splitIntoSections(story_text);
    
    // 1. Extract characters
    if (settings.extract_characters) {
      console.error('Extracting characters...');
      results.extracted.characters = await extractCharacters(sections, story_id);
    }
    
    // 2. Extract locations
    if (settings.extract_locations) {
      console.error('Extracting locations...');
      results.extracted.locations = await extractLocations(sections, story_id);
    }
    
    // 3. Extract events and scenes
    if (settings.extract_events) {
      console.error('Extracting events and scenes...');
      const eventResults = await extractEventsAndScenes(sections, story_id);
      results.extracted.events = eventResults.events;
      results.extracted.scenes = eventResults.scenes;
    }
    
    // 4. Extract relationships and dependencies
    if (settings.extract_relationships) {
      console.error('Extracting relationships and dependencies...');
      results.extracted.dependencies = await extractRelationships(
        results.extracted.events,
        results.extracted.characters,
        story_id
      );
    }
    
    // Validate and deduplicate entities
    if (results.extracted.characters.length > 0) {
      results.extracted.characters = await deduplicateEntities(
        results.extracted.characters,
        'characters',
        settings.resolution_threshold
      );
    }
    
    if (results.extracted.locations.length > 0) {
      results.extracted.locations = await deduplicateEntities(
        results.extracted.locations,
        'locations',
        settings.resolution_threshold
      );
    }
    
    console.error('Analysis complete!');
    return results;
  } catch (error) {
    console.error('Error in analyze_story:', error);
    throw error;
  }
}

// Helper functions for story analysis

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function splitIntoSections(text) {
  // Basic implementation - split by double newlines or headers
  const sections = [];
  const lines = text.split('\n');
  let currentSection = { title: '', content: '' };
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    // Check if it's likely a header
    const isHeader = /^#{1,6}\s+.+$/.test(trimmedLine) || 
                    /^.+\n[=\-]{2,}$/.test(trimmedLine) ||
                    (trimmedLine.length < 60 && /^[A-Z0-9][\w\s:]+$/.test(trimmedLine) && trimmedLine.endsWith(':'));
    
    if (isHeader || trimmedLine === '') {
      // Save previous section if it has content
      if (currentSection.content.trim() !== '') {
        sections.push(currentSection);
      }
      
      // Start new section
      currentSection = {
        title: isHeader ? trimmedLine.replace(/^#{1,6}\s+/, '') : '',
        content: ''
      };
    } else {
      currentSection.content += line + '\n';
    }
  });
  
  // Add the last section
  if (currentSection.content.trim() !== '') {
    sections.push(currentSection);
  }
  
  return sections;
}

async function extractCharacters(sections, story_id) {
  // This would be much more sophisticated in a real implementation
  // using NLP to detect names, relationships, etc.
  const potentialCharacters = new Set();
  const characterData = [];
  
  // Simple pattern matching for character names
  const namePattern = /\b[A-Z][a-z]+(?: [A-Z][a-z]+)*\b/g;
  
  sections.forEach(section => {
    const matches = section.content.match(namePattern) || [];
    matches.forEach(name => {
      if (name.length > 3 && !isCommonWord(name)) {
        potentialCharacters.add(name);
      }
    });
  });
  
  // Convert to character objects and create in DB
  for (const name of potentialCharacters) {
    const { data, error } = await supabase
      .from('characters')
      .insert({
        name,
        description: `Character extracted from story analysis`,
        role: 'unknown', // Would be determined through better analysis
        story_world_id: null,
        story_id: story_id,
        attributes: {}
      })
      .select()
      .single();
    
    if (error) {
      console.error(`Error creating character ${name}:`, error);
    } else {
      characterData.push(data);
    }
  }
  
  return characterData;
}

async function extractLocations(sections, story_id) {
  // Again, this would use more sophisticated NLP in reality
  const potentialLocations = new Set();
  const locationData = [];
  
  // Simple pattern for location detection
  const locationPatterns = [
    /\bin (?:the )?([A-Z][a-z]+(?: [A-Z][a-z]+)*)\b/g,
    /\bat (?:the )?([A-Z][a-z]+(?: [A-Z][a-z]+)*)\b/g,
    /\bto (?:the )?([A-Z][a-z]+(?: [A-Z][a-z]+)*)\b/g
  ];
  
  sections.forEach(section => {
    locationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(section.content)) !== null) {
        const location = match[1];
        if (location.length > 3 && !isCommonWord(location)) {
          potentialLocations.add(location);
        }
      }
    });
  });
  
  // Create location objects in DB
  for (const name of potentialLocations) {
    const { data, error } = await supabase
      .from('locations')
      .insert({
        name,
        description: `Location extracted from story analysis`,
        location_type: 'unknown',
        story_world_id: null,
        story_id: story_id,
        attributes: {}
      })
      .select()
      .single();
    
    if (error) {
      console.error(`Error creating location ${name}:`, error);
    } else {
      locationData.push(data);
    }
  }
  
  return locationData;
}

async function extractEventsAndScenes(sections, story_id) {
  const events = [];
  const scenes = [];
  
  // Each significant section is treated as a potential event and scene
  let sequence = 10;
  
  for (const section of sections) {
    if (section.content.length < 100) continue; // Skip very short sections
    
    // Create event
    const eventTitle = section.title || `Event at ${sequence}`;
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        title: eventTitle,
        description: section.content.substring(0, 200) + '...',
        story_id,
        sequence_number: sequence,
        visible: true
      })
      .select()
      .single();
    
    if (eventError) {
      console.error(`Error creating event for section "${eventTitle}":`, eventError);
      continue;
    }
    
    events.push(event);
    
    // Create corresponding scene
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .insert({
        title: section.title || `Scene at ${sequence}`,
        description: section.content.substring(0, 200) + '...',
        content: section.content,
        event_id: event.id,
        story_id
      })
      .select()
      .single();
    
    if (sceneError) {
      console.error(`Error creating scene for section "${eventTitle}":`, sceneError);
    } else {
      scenes.push(scene);
    }
    
    sequence += 10;
  }
  
  return { events, scenes };
}

async function extractRelationships(events, characters, story_id) {
  const dependencies = [];
  
  // Simple causal relationships based on sequence
  for (let i = 0; i < events.length - 1; i++) {
    // Create chronological dependency between adjacent events
    const { data, error } = await supabase
      .from('event_dependencies')
      .insert({
        predecessor_event_id: events[i].id,
        successor_event_id: events[i + 1].id,
        dependency_type: 'chronological',
        strength: 5
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating event dependency:', error);
    } else {
      dependencies.push(data);
    }
    
    // Link first character to each event - very basic approach
    if (characters.length > 0) {
      await supabase
        .from('character_events')
        .insert({
          character_id: characters[0].id,
          event_id: events[i].id,
          importance: 5,
          character_sequence_number: i * 10
        });
    }
  }
  
  // Link first character to last event too
  if (characters.length > 0 && events.length > 0) {
    await supabase
      .from('character_events')
      .insert({
        character_id: characters[0].id,
        event_id: events[events.length - 1].id,
        importance: 5,
        character_sequence_number: (events.length - 1) * 10
      });
  }
  
  return dependencies;
}

async function deduplicateEntities(entities, type, threshold) {
  // Very basic deduplication strategy - would be much more sophisticated
  // in a real implementation using fuzzy matching and context analysis
  const groups = {};
  
  entities.forEach(entity => {
    const normalizedName = entity.name.toLowerCase();
    if (!groups[normalizedName]) {
      groups[normalizedName] = [];
    }
    groups[normalizedName].push(entity);
  });
  
  const result = [];
  for (const [name, group] of Object.entries(groups)) {
    if (group.length === 1) {
      result.push(group[0]);
    } else {
      // Keep the first instance and mark others as duplicates
      result.push(group[0]);
      console.error(`Found potential duplicates for "${name}" with ${group.length} instances`);
    }
  }
  
  return result;
}

function isCommonWord(word) {
  const commonWords = ['The', 'And', 'But', 'For', 'Or', 'Yet', 'So', 'As', 'If', 'Then'];
  return commonWords.includes(word);
}

// ======================================================
// MCP SERVER SETUP
// ======================================================

// Initialize MCP server
const server = new Server(
  {
    name: "StoryVerse MCP Server",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error("Received list_tools request");
  return { 
    tools: [
      // Style Analysis Tools
      analyzeWritingSampleTool,
      getStyleProfileTool,
      createStyleProfileTool,
      writeInStyleTool,
      
      // Narrative Structure Tools
      getCharacterJourneyTool,
      compareCharacterJourneysTool,
      updateEventSequenceTool, 
      normalizeEventSequenceTool,
      createStoryEventTool,
      addEventWithDependenciesTool,
      addCharacterEventTool,
      findSharedEventsTool,
      addSceneWithEventsTool,
      visualizeTimelineTool,
      analyzeEventImpactTool,
      detectDependencyConflictsTool,
      suggestMissingEventsTool,
      analyzeStoryTool,
      setupStoryWorldTool,
      setupSeriesTool,
      setupStoryTool,
      createCharacterTool,
      createLocationTool,
      createFactionTool,
      createRelationshipTool,
      createItemTool,
      createCharacterArcTool,
      createPlotlineTool
    ] 
  };
});

// Register tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    console.error(`Received call_tool request for: ${request.params.name}`);
    const { name, arguments: args } = request.params;
    
    // ======================================================
    // STYLE ANALYSIS TOOLS
    // ======================================================
    
    // Handle analyze_writing_sample
    if (name === 'analyze_writing_sample') {
      if (!args.text) {
        throw new Error("Text is required for analysis");
      }
      
      const result = await analyzeWritingSample(args);
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully analyzed the writing sample.\n\n${result.summary}`,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    // Handle get_style_profile
    if (name === 'get_style_profile') {
      if (!args.profileId) {
        throw new Error("Profile ID is required");
      }
      
      const result = await getStyleProfile(args);
      
      // Format the response for Claude
      let responseText = `# ${result.profile.name}\n\n`;
      if (result.profile.description) {
        responseText += `${result.profile.description}\n\n`;
      }

      if (result.style_guidance) {
        responseText += result.style_guidance;
      }

      if (result.examples && result.examples.length > 0) {
        responseText += "\n\n## Example Passages\n\n";
        result.examples.forEach((example) => {
          responseText += `### ${example.title}\n\n`;
          responseText += `"${example.excerpt}"\n\n`;
        });
      }
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    // Handle create_style_profile
    if (name === 'create_style_profile') {
      if (!args.name || !args.sampleIds || !args.sampleIds.length) {
        throw new Error("Name and at least one sample ID are required");
      }
      
      const result = await createStyleProfile(args);
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully ${args.profileId ? (args.addToExisting ? 'updated' : 'replaced') : 'created'} style profile "${result.name}" based on ${result.sample_count} samples.`,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    // Handle write_in_style
    if (name === 'write_in_style') {
      if (!args.prompt) {
        throw new Error("Writing prompt is required");
      }
      
      const result = await writeInStyle(args);
      
      // Format the response for Claude
      let responseText = `# Writing Request: ${result.writing_prompt}\n\n`;
      responseText += `Please write in the style of profile "${result.profile_name}". ${result.length_instruction}\n\n`;

      if (result.style_guidance) {
        responseText += result.style_guidance + "\n\n";
      }

      if (result.examples && result.examples.length > 0) {
        responseText += "## Example Passages In This Style\n\n";
        result.examples.forEach((example) => {
          responseText += `### ${example.title}\n\n`;
          responseText += `"${example.excerpt}"\n\n`;
        });
      }

      responseText += "## Your Task\n\n";
      responseText += `Write about: ${result.writing_prompt}\n\n`;
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          }
        ],
      };
    }
    
    // ======================================================
    // ENTITY CREATION IMPLEMENTATION FUNCTIONS
    // ======================================================

    
// Setup a new story world
async function setupStoryWorld(args) {
  try {
    const {
      name,
      description = '',
      genre = [],
      tags = [],
      time_period = null,
      rules = null,
      image_url = null,
      notes = null
    } = args;
    
    // Validate required fields
    if (!name) {
      throw new Error("Story world name is required");
    }
    
    // Create the story world
    const { data: storyWorld, error } = await supabase
      .from('story_worlds')
      .insert({
        name,
        description,
        genre,
        tags,
        time_period,
        rules,
        image_url,
        notes,
        attributes: {}  // Initialize empty JSON for extensibility
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      story_world: storyWorld,
      message: `Successfully created story world "${name}"`
    };
  } catch (error) {
    console.error('Error in setup_story_world:', error);
    throw error;
  }
}

// Setup a new series
async function setupSeries(args) {
  try {
    const {
      name,
      description = '',
      story_world_id = null,
      tags = [],
      status = 'planned',
      target_length = null,
      image_url = null,
      notes = null
    } = args;
    
    // Validate required fields
    if (!name) {
      throw new Error("Series name is required");
    }
    
    // If story_world_id is provided, verify it exists
    if (story_world_id) {
      const { data: storyWorld, error: swError } = await supabase
        .from('story_worlds')
        .select('id')
        .eq('id', story_world_id)
        .single();
      
      if (swError || !storyWorld) {
        throw new Error(`Story world with ID ${story_world_id} not found`);
      }
    }
    
    // Create the series
    const { data: series, error } = await supabase
      .from('series')
      .insert({
        name,
        description,
        story_world_id,
        tags,
        status,
        target_length,
        image_url,
        notes,
        attributes: {}  // Initialize empty JSON for extensibility
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      series,
      message: `Successfully created series "${name}"${story_world_id ? ' in the specified story world' : ''}`
    };
  } catch (error) {
    console.error('Error in setup_series:', error);
    throw error;
  }
}

// Setup a new story
async function setupStory(args) {
  try {
    const {
      title,
      description = '',
      story_world_id = null,
      series_id = null,
      status = 'concept',
      story_type = 'other',
      word_count_target = null,
      synopsis = null,
      image_url = null,
      notes = null
    } = args;
    
    // Validate required fields
    if (!title) {
      throw new Error("Story title is required");
    }
    
    // Verify story_world_id if provided
    if (story_world_id) {
      const { data: storyWorld, error: swError } = await supabase
        .from('story_worlds')
        .select('id')
        .eq('id', story_world_id)
        .single();
      
      if (swError || !storyWorld) {
        throw new Error(`Story world with ID ${story_world_id} not found`);
      }
    }
    
    // Verify series_id if provided
    if (series_id) {
      const { data: series, error: seriesError } = await supabase
        .from('series')
        .select('id')
        .eq('id', series_id)
        .single();
      
      if (seriesError || !series) {
        throw new Error(`Series with ID ${series_id} not found`);
      }
    }
    
    // Create the story
    const { data: story, error } = await supabase
      .from('stories')
      .insert({
        title,
        name: title,  // For compatibility with existing code
        description,
        story_world_id,
        series_id,
        status,
        story_type,
        word_count_target,
        synopsis,
        image_url,
        notes,
        attributes: {}  // Initialize empty JSON for extensibility
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      story,
      message: `Successfully created story "${title}"${story_world_id ? ' in the specified story world' : ''}${series_id ? ' as part of the specified series' : ''}`
    };
  } catch (error) {
    console.error('Error in setup_story:', error);
    throw error;
  }
}

// Create a new character
async function createCharacter(args) {
  try {
    const {
      name,
      description = '',
      story_world_id = null,
      story_id = null,
      role = 'supporting',
      appearance = null,
      background = null,
      motivation = null,
      personality = null,
      age = null,
      faction_id = null,
      location_id = null,
      image_url = null,
      notes = null
    } = args;
    
    // Validate required fields
    if (!name) {
      throw new Error("Character name is required");
    }
    
    // Verify story_world_id if provided
    if (story_world_id) {
      const { data: storyWorld, error: swError } = await supabase
        .from('story_worlds')
        .select('id')
        .eq('id', story_world_id)
        .single();
      
      if (swError || !storyWorld) {
        throw new Error(`Story world with ID ${story_world_id} not found`);
      }
    }
    
    // Verify story_id if provided
    if (story_id) {
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('id')
        .eq('id', story_id)
        .single();
      
      if (storyError || !story) {
        throw new Error(`Story with ID ${story_id} not found`);
      }
    }
    
    // Verify faction_id if provided
    if (faction_id) {
      const { data: faction, error: factionError } = await supabase
        .from('factions')
        .select('id')
        .eq('id', faction_id)
        .single();
      
      if (factionError || !faction) {
        throw new Error(`Faction with ID ${faction_id} not found`);
      }
    }
    
    // Verify location_id if provided
    if (location_id) {
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('id')
        .eq('id', location_id)
        .single();
      
      if (locationError || !location) {
        throw new Error(`Location with ID ${location_id} not found`);
      }
    }
    
    // Create the character
    const { data: character, error } = await supabase
      .from('characters')
      .insert({
        name,
        description,
        story_world_id,
        story_id,
        role,
        appearance,
        background,
        motivation,
        personality,
        age,
        faction_id,
        location_id,
        image_url,
        notes,
        attributes: {
          appearance,
          background,
          motivation,
          personality
        }  // Store these fields in attributes as well for flexibility
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      character,
      message: `Successfully created character "${name}"`
    };
  } catch (error) {
    console.error('Error in create_character:', error);
    throw error;
  }
}

// Create a new location
async function createLocation(args) {
  try {
    const {
      name,
      description = '',
      story_world_id = null,
      story_id = null,
      location_type = 'other',
      parent_location_id = null,
      climate = null,
      culture = null,
      map_coordinates = null,
      notable_features = null,
      image_url = null,
      notes = null
    } = args;
    
    // Validate required fields
    if (!name) {
      throw new Error("Location name is required");
    }
    
    // Verify story_world_id if provided
    if (story_world_id) {
      const { data: storyWorld, error: swError } = await supabase
        .from('story_worlds')
        .select('id')
        .eq('id', story_world_id)
        .single();
      
      if (swError || !storyWorld) {
        throw new Error(`Story world with ID ${story_world_id} not found`);
      }
    }
    
    // Verify story_id if provided
    if (story_id) {
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('id')
        .eq('id', story_id)
        .single();
      
      if (storyError || !story) {
        throw new Error(`Story with ID ${story_id} not found`);
      }
    }
    
    // Verify parent_location_id if provided
    if (parent_location_id) {
      const { data: parentLocation, error: locationError } = await supabase
        .from('locations')
        .select('id')
        .eq('id', parent_location_id)
        .single();
      
      if (locationError || !parentLocation) {
        throw new Error(`Parent location with ID ${parent_location_id} not found`);
      }
    }
    
    // Create the location
    const { data: location, error } = await supabase
      .from('locations')
      .insert({
        name,
        description,
        story_world_id,
        story_id,
        location_type,
        parent_location_id,
        climate,
        culture,
        map_coordinates,
        notable_features,
        image_url,
        notes,
        attributes: {
          climate,
          culture,
          notable_features
        }  // Store these fields in attributes as well for flexibility
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      location,
      message: `Successfully created location "${name}"`
    };
  } catch (error) {
    console.error('Error in create_location:', error);
    throw error;
  }
}

// Create a new faction
async function createFaction(args) {
  try {
    const {
      name,
      description = '',
      story_world_id = null,
      story_id = null,
      faction_type = 'organization',
      leader_character_id = null,
      headquarters_location_id = null,
      ideology = null,
      goals = null,
      resources = null,
      image_url = null,
      notes = null
    } = args;
    
    // Validate required fields
    if (!name) {
      throw new Error("Faction name is required");
    }
    
    // Verify story_world_id if provided
    if (story_world_id) {
      const { data: storyWorld, error: swError } = await supabase
        .from('story_worlds')
        .select('id')
        .eq('id', story_world_id)
        .single();
      
      if (swError || !storyWorld) {
        throw new Error(`Story world with ID ${story_world_id} not found`);
      }
    }
    
    // Verify story_id if provided
    if (story_id) {
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('id')
        .eq('id', story_id)
        .single();
      
      if (storyError || !story) {
        throw new Error(`Story with ID ${story_id} not found`);
      }
    }
    
    // Verify leader_character_id if provided
    if (leader_character_id) {
      const { data: character, error: characterError } = await supabase
        .from('characters')
        .select('id')
        .eq('id', leader_character_id)
        .single();
      
      if (characterError || !character) {
        throw new Error(`Character with ID ${leader_character_id} not found`);
      }
    }
    
    // Verify headquarters_location_id if provided
    if (headquarters_location_id) {
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('id')
        .eq('id', headquarters_location_id)
        .single();
      
      if (locationError || !location) {
        throw new Error(`Location with ID ${headquarters_location_id} not found`);
      }
    }
    
    // Create the faction
    const { data: faction, error } = await supabase
      .from('factions')
      .insert({
        name,
        description,
        story_world_id,
        story_id,
        faction_type,
        leader_character_id,
        headquarters_location_id,
        ideology,
        goals,
        resources,
        image_url,
        notes,
        attributes: {
          ideology,
          goals,
          resources
        }  // Store these fields in attributes as well for flexibility
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      faction,
      message: `Successfully created faction "${name}"`
    };
  } catch (error) {
    console.error('Error in create_faction:', error);
    throw error;
  }
}

// Create a relationship between characters
async function createRelationship(args) {
  try {
    const {
      character1_id,
      character2_id,
      relationship_type,
      description = '',
      intensity = 5,
      story_id = null,
      notes = null
    } = args;
    
    // Validate required fields
    if (!character1_id || !character2_id) {
      throw new Error("Both character IDs are required");
    }
    
    if (!relationship_type) {
      throw new Error("Relationship type is required");
    }
    
    // Verify character1_id
    const { data: character1, error: char1Error } = await supabase
      .from('characters')
      .select('id, name')
      .eq('id', character1_id)
      .single();
    
    if (char1Error || !character1) {
      throw new Error(`Character with ID ${character1_id} not found`);
    }
    
    // Verify character2_id
    const { data: character2, error: char2Error } = await supabase
      .from('characters')
      .select('id, name')
      .eq('id', character2_id)
      .single();
    
    if (char2Error || !character2) {
      throw new Error(`Character with ID ${character2_id} not found`);
    }
    
    // Verify story_id if provided
    if (story_id) {
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('id')
        .eq('id', story_id)
        .single();
      
      if (storyError || !story) {
        throw new Error(`Story with ID ${story_id} not found`);
      }
    }
    
    // Check if relationship already exists
    const { data: existingRel, error: existingError } = await supabase
      .from('character_relationships')
      .select('id')
      .or(`and(character1_id.eq.${character1_id},character2_id.eq.${character2_id}),and(character1_id.eq.${character2_id},character2_id.eq.${character1_id})`)
      .maybeSingle();
    
    let relationship;
    
    if (existingRel) {
      // Update existing relationship
      const { data: updatedRel, error: updateError } = await supabase
        .from('character_relationships')
        .update({
          relationship_type,
          description,
          intensity,
          story_id,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRel.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      relationship = updatedRel;
      
      return {
        success: true,
        relationship,
        updated: true,
        message: `Updated relationship between ${character1.name} and ${character2.name}`
      };
    } else {
      // Create new relationship
      const { data: newRel, error: insertError } = await supabase
        .from('character_relationships')
        .insert({
          character1_id,
          character2_id,
          relationship_type,
          description,
          intensity,
          story_id,
          notes
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      relationship = newRel;
      
      return {
        success: true,
        relationship,
        updated: false,
        message: `Created relationship between ${character1.name} and ${character2.name}`
      };
    }
  } catch (error) {
    console.error('Error in create_relationship:', error);
    throw error;
  }
}

// Create a new item/artifact
async function createItem(args) {
  try {
    const {
      name,
      description = '',
      story_world_id = null,
      story_id = null,
      item_type = 'other',
      owner_character_id = null,
      location_id = null,
      properties = null,
      significance = null,
      image_url = null,
      notes = null
    } = args;
    
    // Validate required fields
    if (!name) {
      throw new Error("Item name is required");
    }
    
    // Verify story_world_id if provided
    if (story_world_id) {
      const { data: storyWorld, error: swError } = await supabase
        .from('story_worlds')
        .select('id')
        .eq('id', story_world_id)
        .single();
      
      if (swError || !storyWorld) {
        throw new Error(`Story world with ID ${story_world_id} not found`);
      }
    }
    
    // Verify story_id if provided
    if (story_id) {
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('id')
        .eq('id', story_id)
        .single();
      
      if (storyError || !story) {
        throw new Error(`Story with ID ${story_id} not found`);
      }
    }
    
    // Verify owner_character_id if provided
    if (owner_character_id) {
      const { data: character, error: characterError } = await supabase
        .from('characters')
        .select('id')
        .eq('id', owner_character_id)
        .single();
      
      if (characterError || !character) {
        throw new Error(`Character with ID ${owner_character_id} not found`);
      }
    }
    
    // Verify location_id if provided
    if (location_id) {
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('id')
        .eq('id', location_id)
        .single();
      
      if (locationError || !location) {
        throw new Error(`Location with ID ${location_id} not found`);
      }
    }
    
    // Create the item
    const { data: item, error } = await supabase
      .from('items')
      .insert({
        name,
        description,
        story_world_id,
        story_id,
        item_type,
        owner_character_id,
        location_id,
        properties,
        significance,
        image_url,
        notes,
        attributes: {
          properties,
          significance
        }  // Store these fields in attributes as well for flexibility
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      item,
      message: `Successfully created item "${name}"`
    };
  } catch (error) {
    console.error('Error in create_item:', error);
    throw error;
  }
}

// Create a character arc
async function createCharacterArc(args) {
  try {
    const {
      character_id,
      story_id,
      title,
      description = '',
      starting_state = null,
      ending_state = null,
      catalyst = null,
      challenges = [],
      key_events = [],
      theme = null,
      notes = null
    } = args;
    
    // Validate required fields
    if (!character_id || !story_id || !title) {
      throw new Error("Character ID, story ID, and title are required");
    }
    
    // Verify character_id
    const { data: character, error: charError } = await supabase
      .from('characters')
      .select('id, name')
      .eq('id', character_id)
      .single();
    
    if (charError || !character) {
      throw new Error(`Character with ID ${character_id} not found`);
    }
    
    // Verify story_id
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, title')
      .eq('id', story_id)
      .single();
    
    if (storyError || !story) {
      throw new Error(`Story with ID ${story_id} not found`);
    }
    
    // Verify key_events if provided
    if (key_events && key_events.length > 0) {
      for (const eventId of key_events) {
        const { data, error } = await supabase
          .from('events')
          .select('id')
          .eq('id', eventId)
          .single();
        
        if (error || !data) {
          throw new Error(`Event with ID ${eventId} not found`);
        }
      }
    }
    
    // Create the character arc
    const { data: characterArc, error } = await supabase
      .from('character_arcs')
      .insert({
        character_id,
        story_id,
        title,
        description,
        starting_state,
        ending_state,
        catalyst,
        challenges,
        key_events,
        theme,
        notes
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // If key events are provided, create links to those events
    for (const eventId of key_events) {
      await supabase
        .from('arc_events')
        .insert({
          arc_id: characterArc.id,
          event_id: eventId,
          arc_type: 'character_arc'
        });
    }
    
    return {
      success: true,
      character_arc: characterArc,
      message: `Successfully created character arc "${title}" for ${character.name} in ${story.title}`
    };
  } catch (error) {
    console.error('Error in create_character_arc:', error);
    throw error;
  }
}

// Create a plotline
async function createPlotline(args) {
  try {
    const {
      title,
      description = '',
      story_id,
      plotline_type = 'subplot',
      events = [],
      characters = [],
      starting_event_id = null,
      climax_event_id = null,
      resolution_event_id = null,
      theme = null,
      notes = null
    } = args;
    
    // Validate required fields
    if (!title || !story_id) {
      throw new Error("Title and story ID are required");
    }
    
    // Verify story_id
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, title')
      .eq('id', story_id)
      .single();
    
    if (storyError || !story) {
      throw new Error(`Story with ID ${story_id} not found`);
    }
    
    // Verify events if provided
    if (events && events.length > 0) {
      for (const eventId of events) {
        const { data, error } = await supabase
          .from('events')
          .select('id')
          .eq('id', eventId)
          .single();
        
        if (error || !data) {
          throw new Error(`Event with ID ${eventId} not found`);
        }
      }
    }
    
    // Verify characters if provided
    if (characters && characters.length > 0) {
      for (const characterId of characters) {
        const { data, error } = await supabase
          .from('characters')
          .select('id')
          .eq('id', characterId)
          .single();
        
        if (error || !data) {
          throw new Error(`Character with ID ${characterId} not found`);
        }
      }
    }
    
    // Verify specific event IDs if provided
    if (starting_event_id) {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('id', starting_event_id)
        .single();
      
      if (error || !data) {
        throw new Error(`Starting event with ID ${starting_event_id} not found`);
      }
    }
    
    if (climax_event_id) {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('id', climax_event_id)
        .single();
      
      if (error || !data) {
        throw new Error(`Climax event with ID ${climax_event_id} not found`);
      }
    }
    
    if (resolution_event_id) {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .eq('id', resolution_event_id)
        .single();
      
      if (error || !data) {
        throw new Error(`Resolution event with ID ${resolution_event_id} not found`);
      }
    }
    
    // Create the plotline
    const { data: plotline, error } = await supabase
      .from('plotlines')
      .insert({
        title,
        description,
        story_id,
        plotline_type,
        starting_event_id,
        climax_event_id,
        resolution_event_id,
        theme,
        notes
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // If events are provided, create links to those events
    for (const eventId of events) {
      await supabase
        .from('plotline_events')
        .insert({
          plotline_id: plotline.id,
          event_id: eventId
        });
    }
    
    // If characters are provided, create links to those characters
    for (const characterId of characters) {
      await supabase
        .from('plotline_characters')
        .insert({
          plotline_id: plotline.id,
          character_id: characterId
        });
    }
    
    return {
      success: true,
      plotline,
      message: `Successfully created plotline "${title}" in ${story.title}`
    };
  } catch (error) {
    console.error('Error in create_plotline:', error);
    throw error;
  }
}

    // ======================================================
    // SCENE MANAGEMENT IMPLEMENTATION FUNCTIONS
    // ======================================================
    
    // ======================================================
// SCENE MANAGEMENT IMPLEMENTATION FUNCTIONS
// ======================================================

/**
 * Imports a new scene into the system
 * 
 * @param {object} args - The function arguments
 * @returns {object} Created scene data
 */
async function importScene(args) {
  try {
    const {
      content,
      title,
      project_id, // Note: StoryVerse uses story_id, not project_id
      type = 'scene',
      format = 'plain',
      sequence_number = null
    } = args;
    
    // Map project_id to story_id for consistency with existing codebase
    const story_id = project_id;
    
    // Validate required fields
    if (!content) {
      throw new Error("Scene content is required");
    }
    
    if (!story_id) {
      throw new Error("Project/Story ID is required");
    }
    
    // Verify story exists
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, title')
      .eq('id', story_id)
      .single();
    
    if (storyError || !story) {
      throw new Error(`Story with ID ${story_id} not found`);
    }
    
    // Determine sequence number if not provided
    let seq_num = sequence_number;
    if (seq_num === null) {
      const { data: lastScene, error: seqError } = await supabase
        .from('scenes')
        .select('sequence_number')
        .eq('story_id', story_id)
        .order('sequence_number', { ascending: false })
        .limit(1);
      
      if (!seqError && lastScene.length > 0) {
        seq_num = lastScene[0].sequence_number + 10;
      } else {
        seq_num = 10; // Start at 10 if no scenes exist
      }
    }
    
    // Create the scene
    const sceneTitle = title || `New Scene ${new Date().toISOString()}`;
    const { data: scene, error } = await supabase
      .from('scenes')
      .insert({
        title: sceneTitle,
        content,
        story_id,
        type,
        format,
        sequence_number: seq_num,
        is_visible: true,
        metadata: {}
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Create initial version record
    const { data: version, error: versionError } = await supabase
      .from('scene_versions')
      .insert({
        scene_id: scene.id,
        content,
        version_number: 1,
        notes: 'Initial version'
      })
      .select()
      .single();
    
    if (versionError) {
      console.error('Error creating initial version:', versionError);
      // Continue even if version creation fails
    }
    
    return {
      success: true,
      scene,
      version: version || null,
      message: `Successfully imported scene "${sceneTitle}" into "${story.title}"`
    };
  } catch (error) {
    console.error('Error in import_scene:', error);
    throw error;
  }
}

/**
 * Imports and parses a full text into multiple scenes
 * 
 * @param {object} args - The function arguments
 * @returns {object} Created scenes data
 */
async function importText(args) {
  try {
    const {
      content,
      project_id, // StoryVerse uses story_id
      detect_scenes = true,
      scene_delimiter = null
    } = args;
    
    // Map project_id to story_id for consistency
    const story_id = project_id;
    
    // Validate required fields
    if (!content) {
      throw new Error("Text content is required");
    }
    
    if (!story_id) {
      throw new Error("Project/Story ID is required");
    }
    
    // Verify story exists
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, title')
      .eq('id', story_id)
      .single();
    
    if (storyError || !story) {
      throw new Error(`Story with ID ${story_id} not found`);
    }
    
    // Parse the text into scenes
    let scenes = [];
    
    if (detect_scenes) {
      // Determine starting sequence number
      const { data: lastScene, error: seqError } = await supabase
        .from('scenes')
        .select('sequence_number')
        .eq('story_id', story_id)
        .order('sequence_number', { ascending: false })
        .limit(1);
      
      let nextSequence = 10;
      if (!seqError && lastScene.length > 0) {
        nextSequence = lastScene[0].sequence_number + 10;
      }
      
      // Split the text based on delimiter or heuristics
      const sections = splitTextIntoScenes(content, scene_delimiter);
      
      // Create each scene
      for (const section of sections) {
        const { data: scene, error } = await supabase
          .from('scenes')
          .insert({
            title: section.title || `Scene ${nextSequence}`,
            content: section.content,
            story_id,
            type: 'scene',
            format: detectFormat(section.content),
            sequence_number: nextSequence,
            is_visible: true,
            metadata: {}
          })
          .select()
          .single();
        
        if (error) {
          console.error(`Error creating scene: ${error.message}`);
          continue;
        }
        
        // Create initial version
        await supabase
          .from('scene_versions')
          .insert({
            scene_id: scene.id,
            content: section.content,
            version_number: 1,
            notes: 'Initial version from text import'
          });
        
        scenes.push(scene);
        nextSequence += 10;
      }
    } else {
      // Import as a single scene
      const result = await importScene({
        content,
        title: 'Imported Text',
        project_id: story_id,
        type: 'scene',
        format: detectFormat(content)
      });
      
      scenes = [result.scene];
    }
    
    return {
      success: true,
      scenes,
      scene_count: scenes.length,
      message: `Successfully imported text as ${scenes.length} scene(s) into "${story.title}"`
    };
  } catch (error) {
    console.error('Error in import_text:', error);
    throw error;
  }
}

/**
 * Helper function to split text into scenes based on delimiter or heuristics
 */
function splitTextIntoScenes(text, delimiter) {
  const sections = [];
  
  if (delimiter) {
    // Split by custom delimiter
    const parts = text.split(new RegExp(delimiter, 'g'));
    
    parts.forEach((part, index) => {
      if (part.trim().length === 0) return;
      
      // Extract title from first line if it looks like a title
      const lines = part.trim().split('\n');
      let title = `Scene ${index + 1}`;
      let content = part.trim();
      
      // If first line is short and doesn't end with punctuation, it's likely a title
      if (lines[0].length < 50 && !lines[0].match(/[.!?:;,]$/)) {
        title = lines[0].trim();
        content = lines.slice(1).join('\n').trim();
      }
      
      sections.push({ title, content });
    });
  } else {
    // Detect scenes based on patterns:
    
    // 1. Look for scene headers in screenplay format (e.g., "INT. BEDROOM - DAY")
    const screenplayPattern = /^(INT|EXT|INT\/EXT|EXT\/INT|I\/E|E\/I)[. ].+?(-|–|—)[ ]?.+$/gm;
    
    // 2. Look for chapter/scene markers like "Chapter 1", "Scene 3", etc.
    const chapterPattern = /^(Chapter|CHAPTER|Scene|SCENE)[ \t]*[\d\w]+.*$/gm;
    
    // 3. Look for markdown-style headers (e.g., "# Scene Title")
    const markdownPattern = /^#{1,3}[ \t]*.+$/gm;
    
    // 4. Look for line breaks with symbols (e.g., "* * *" or "---")
    const breakPattern = /^[ \t]*([*\-=#_~+]{3,})[ \t]*$/gm;
    
    // Find all potential scene breaks
    const matches = [];
    let match;
    
    // Collect all potential break points
    [screenplayPattern, chapterPattern, markdownPattern, breakPattern].forEach(pattern => {
      while ((match = pattern.exec(text)) !== null) {
        matches.push({
          index: match.index,
          text: match[0]
        });
      }
    });
    
    // Sort by position in text
    matches.sort((a, b) => a.index - b.index);
    
    // Split text at each break point
    if (matches.length > 0) {
      let lastIndex = 0;
      
      matches.forEach((match, index) => {
        if (match.index > lastIndex) {
          const sectionText = text.substring(lastIndex, match.index).trim();
          if (sectionText.length > 0) {
            sections.push({
              title: `Scene ${sections.length + 1}`,
              content: sectionText
            });
          }
        }
        
        // The matched header becomes the title for the next section
        const nextContent = index < matches.length - 1
          ? text.substring(match.index, matches[index + 1].index)
          : text.substring(match.index);
        
        if (nextContent.trim().length > 0) {
          // Extract title from the header line
          const headerLine = match.text.trim();
          let title = headerLine;
          
          // Clean up title
          title = title.replace(/^#{1,3}[ \t]*/, ''); // Remove markdown header markers
          title = title.replace(/^(Chapter|CHAPTER|Scene|SCENE)[ \t]*[\d\w]+[ \t]*[:\.]/i, '').trim(); // Clean chapter/scene prefixes
          
          if (title.length > 50) {
            title = title.substring(0, 47) + '...';
          }
          
          sections.push({
            title: title || `Scene ${sections.length + 1}`,
            content: nextContent.trim()
          });
        }
        
        lastIndex = match.index + match.text.length;
      });
      
      // Add final section if needed
      if (lastIndex < text.length) {
        const finalText = text.substring(lastIndex).trim();
        if (finalText.length > 0) {
          sections.push({
            title: `Scene ${sections.length + 1}`,
            content: finalText
          });
        }
      }
    } else {
      // No scene breaks found, treat as one scene
      sections.push({
        title: 'Scene 1',
        content: text.trim()
      });
    }
  }
  
  return sections;
}

/**
 * Helper function to detect the format of content
 */
function detectFormat(content) {
  // Check for Fountain format markers
  const fountainPatterns = [
    /^(INT|EXT|INT\/EXT|EXT\/INT|I\/E|E\/I)[. ].+?(-|–|—)[ ]?.+$/m, // Scene headers
    /^[A-Z][A-Z\s]+$/m, // Character names
    /^\([^)]+\)$/m, // Parentheticals
    /^\.[\w\s]+/m, // Scene action starting with a dot
  ];
  
  const hasFountainSyntax = fountainPatterns.some(pattern => pattern.test(content));
  
  if (hasFountainSyntax) return 'fountain';
  
  // Check for Markdown syntax
  const markdownPatterns = [
    /^#{1,6}\s+.+$/m, // Headers
    /^\*\*.+\*\*$/m, // Bold
    /^\*.+\*$/m, // Italic
    /^>\s+.+$/m, // Blockquotes
    /^-\s+.+$/m, // Unordered lists
    /^\d+\.\s+.+$/m, // Ordered lists
    /^```[\s\S]+```$/m, // Code blocks
  ];
  
  const hasMarkdownSyntax = markdownPatterns.some(pattern => pattern.test(content));
  
  if (hasMarkdownSyntax) return 'markdown';
  
  // Default to plain text
  return 'plain';
}

/**
 * Creates a new version of an existing scene
 * 
 * @param {object} args - The function arguments
 * @returns {object} Created version data
 */
async function createSceneVersion(args) {
  try {
    const {
      scene_id,
      content,
      notes = ''
    } = args;
    
    // Validate required fields
    if (!scene_id || !content) {
      throw new Error("Scene ID and content are required");
    }
    
    // Verify scene exists and get current data
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', scene_id)
      .single();
    
    if (sceneError || !scene) {
      throw new Error(`Scene with ID ${scene_id} not found`);
    }
    
    // Get the current highest version number
    const { data: versions, error: versionsError } = await supabase
      .from('scene_versions')
      .select('version_number')
      .eq('scene_id', scene_id)
      .order('version_number', { ascending: false })
      .limit(1);
    
    if (versionsError) throw versionsError;
    
    const nextVersionNumber = versions.length > 0 ? versions[0].version_number + 1 : 1;
    
    // Create new version
    const { data: version, error: versionError } = await supabase
      .from('scene_versions')
      .insert({
        scene_id,
        content,
        version_number: nextVersionNumber,
        notes
      })
      .select()
      .single();
    
    if (versionError) throw versionError;
    
    // Update the scene with the new content
    const { data: updatedScene, error: updateError } = await supabase
      .from('scenes')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', scene_id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    return {
      success: true,
      scene: updatedScene,
      version,
      previous_version: versions.length > 0 ? versions[0].version_number : null,
      message: `Successfully created version ${nextVersionNumber} of scene "${scene.title}"`
    };
  } catch (error) {
    console.error('Error in create_scene_version:', error);
    throw error;
  }
}

/**
 * Retrieves version history for a scene
 * 
 * @param {object} args - The function arguments
 * @returns {object} Scene versions
 */
async function getSceneVersions(args) {
  try {
    const { scene_id } = args;
    
    // Validate required fields
    if (!scene_id) {
      throw new Error("Scene ID is required");
    }
    
    // Verify scene exists
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', scene_id)
      .single();
    
    if (sceneError || !scene) {
      throw new Error(`Scene with ID ${scene_id} not found`);
    }
    
    // Get all versions
    const { data: versions, error: versionsError } = await supabase
      .from('scene_versions')
      .select('*')
      .eq('scene_id', scene_id)
      .order('version_number', { ascending: false });
    
    if (versionsError) throw versionsError;
    
    return {
      success: true,
      scene,
      versions,
      version_count: versions.length,
      current_content: scene.content,
      message: `Retrieved ${versions.length} versions for scene "${scene.title}"`
    };
  } catch (error) {
    console.error('Error in get_scene_versions:', error);
    throw error;
  }
}

/**
 * Restores a scene to a previous version
 * 
 * @param {object} args - The function arguments
 * @returns {object} Restored scene data
 */
async function restoreSceneVersion(args) {
  try {
    const { version_id } = args;
    
    // Validate required fields
    if (!version_id) {
      throw new Error("Version ID is required");
    }
    
    // Get the version to restore
    const { data: version, error: versionError } = await supabase
      .from('scene_versions')
      .select('*')
      .eq('id', version_id)
      .single();
    
    if (versionError || !version) {
      throw new Error(`Version with ID ${version_id} not found`);
    }
    
    // Get the scene
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', version.scene_id)
      .single();
    
    if (sceneError || !scene) {
      throw new Error(`Scene with ID ${version.scene_id} not found`);
    }
    
    // Create a new version before restoring (to save current state)
    const { data: currentVersion, error: currentError } = await supabase
      .from('scene_versions')
      .select('version_number')
      .eq('scene_id', scene.id)
      .order('version_number', { ascending: false })
      .limit(1);
    
    if (!currentError && currentVersion.length > 0) {
      // Only create a backup version if the content is different
      if (scene.content !== version.content) {
        await supabase
          .from('scene_versions')
          .insert({
            scene_id: scene.id,
            content: scene.content,
            version_number: currentVersion[0].version_number + 1,
            notes: `Automatic backup before restoring version ${version.version_number}`
          });
      }
    }
    
    // Update the scene with the restored content
    const { data: updatedScene, error: updateError } = await supabase
      .from('scenes')
      .update({
        content: version.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', scene.id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    return {
      success: true,
      scene: updatedScene,
      restored_version: version,
      message: `Successfully restored scene "${scene.title}" to version ${version.version_number}`
    };
  } catch (error) {
    console.error('Error in restore_scene_version:', error);
    throw error;
  }
}

/**
 * Creates a detailed comparison between two scene versions
 * 
 * @param {object} args - The function arguments
 * @returns {object} Comparison data
 */
async function compareSceneVersions(args) {
  try {
    const {
      scene_id,
      version_1 = null,
      version_2 = null,
      format = 'html'
    } = args;
    
    // Validate required fields
    if (!scene_id) {
      throw new Error("Scene ID is required");
    }
    
    // Get all versions for the scene
    const { data: versions, error: versionsError } = await supabase
      .from('scene_versions')
      .select('*')
      .eq('scene_id', scene_id)
      .order('version_number', { ascending: false });
    
    if (versionsError) throw versionsError;
    
    if (versions.length < 2) {
      throw new Error("Scene does not have enough versions for comparison");
    }
    
    // Determine which versions to compare
    let oldVersion, newVersion;
    
    if (version_1 !== null && version_2 !== null) {
      // Find specific versions requested
      oldVersion = versions.find(v => v.version_number === version_1);
      newVersion = versions.find(v => v.version_number === version_2);
      
      if (!oldVersion || !newVersion) {
        throw new Error("One or both specified versions not found");
      }
    } else {
      // Compare latest to previous by default
      newVersion = versions[0];
      oldVersion = versions[1];
    }
    
    // Ensure newer version is always second
    if (oldVersion.version_number > newVersion.version_number) {
      [oldVersion, newVersion] = [newVersion, oldVersion];
    }
    
    // Get the scene
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('title')
      .eq('id', scene_id)
      .single();
    
    if (sceneError) throw sceneError;
    
    // Generate diff
    const diff = generateDiff(
      oldVersion.content,
      newVersion.content,
      format
    );
    
    return {
      success: true,
      scene_title: scene.title,
      old_version: {
        number: oldVersion.version_number,
        created_at: oldVersion.created_at,
        notes: oldVersion.notes
      },
      new_version: {
        number: newVersion.version_number,
        created_at: newVersion.created_at,
        notes: newVersion.notes
      },
      comparison: diff,
      format
    };
  } catch (error) {
    console.error('Error in compare_scene_versions:', error);
    throw error;
  }
}

/**
 * Helper function to generate text diff
 */
function generateDiff(oldText, newText, format) {
  // Simple character-by-character diff for demonstration
  // In a real implementation, you'd use a diff library like 'diff' or 'jsdiff'
  
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  // Track additions, deletions and unchanged lines
  const changes = [];
  
  // Find the maximum length
  const maxLen = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLen; i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : null;
    const newLine = i < newLines.length ? newLines[i] : null;
    
    if (oldLine === null) {
      // Line added
      changes.push({ type: 'addition', content: newLine });
    } else if (newLine === null) {
      // Line removed
      changes.push({ type: 'deletion', content: oldLine });
    } else if (oldLine !== newLine) {
      // Line changed
      changes.push({ type: 'deletion', content: oldLine });
      changes.push({ type: 'addition', content: newLine });
    } else {
      // Line unchanged
      changes.push({ type: 'unchanged', content: oldLine });
    }
  }
  
  // Format the output according to requested format
  if (format === 'html') {
    let html = '<div class="diff">';
    changes.forEach(change => {
      if (change.type === 'addition') {
        html += `<div class="addition">${escapeHtml(change.content)}</div>`;
      } else if (change.type === 'deletion') {
        html += `<div class="deletion">${escapeHtml(change.content)}</div>`;
      } else {
        html += `<div class="unchanged">${escapeHtml(change.content)}</div>`;
      }
    });
    html += '</div>';
    return html;
  } else if (format === 'text') {
    let text = '';
    changes.forEach(change => {
      if (change.type === 'addition') {
        text += `+ ${change.content}\n`;
      } else if (change.type === 'deletion') {
        text += `- ${change.content}\n`;
      } else {
        text += `  ${change.content}\n`;
      }
    });
    return text;
  } else {
    // JSON format
    return changes;
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Adds a comment to a scene
 * 
 * @param {object} args - The function arguments
 * @returns {object} Created comment data
 */
async function addSceneComment(args) {
  try {
    const {
      scene_id,
      content,
      position = null,
      type = 'comment'
    } = args;
    
    // Validate required fields
    if (!scene_id || !content) {
      throw new Error("Scene ID and comment content are required");
    }
    
    // Verify scene exists
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('title')
      .eq('id', scene_id)
      .single();
    
    if (sceneError || !scene) {
      throw new Error(`Scene with ID ${scene_id} not found`);
    }
    
    // Create the comment
    const { data: comment, error } = await supabase
      .from('scene_comments')
      .insert({
        scene_id,
        content,
        position: position ? JSON.stringify(position) : null,
        type,
        resolved: false
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      comment,
      message: `Successfully added ${type} to scene "${scene.title}"`
    };
  } catch (error) {
    console.error('Error in add_scene_comment:', error);
    throw error;
  }
}

/**
 * Marks a comment as resolved or unresolved
 * 
 * @param {object} args - The function arguments
 * @returns {object} Updated comment data
 */
async function resolveSceneComment(args) {
  try {
    const {
      comment_id,
      resolved
    } = args;
    
    // Validate required fields
    if (!comment_id) {
      throw new Error("Comment ID is required");
    }
    
    // Update the comment
    const { data: comment, error } = await supabase
      .from('scene_comments')
      .update({
        resolved: !!resolved
      })
      .eq('id', comment_id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Get scene info for the message
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('title')
      .eq('id', comment.scene_id)
      .single();
    
    const sceneName = !sceneError ? scene.title : 'the scene';
    
    return {
      success: true,
      comment,
      message: `Successfully marked comment as ${resolved ? 'resolved' : 'unresolved'} in "${sceneName}"`
    };
  } catch (error) {
    console.error('Error in resolve_scene_comment:', error);
    throw error;
  }
}

/**
 * Processes a scene according to instructions, creating a new version
 * 
 * @param {object} args - The function arguments
 * @returns {object} Updated scene data
 */
async function processScene(args) {
  try {
    const {
      scene_id,
      instructions
    } = args;
    
    // Validate required fields
    if (!scene_id || !instructions) {
      throw new Error("Scene ID and instructions are required");
    }
    
    // Get the current scene
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', scene_id)
      .single();
    
    if (sceneError || !scene) {
      throw new Error(`Scene with ID ${scene_id} not found`);
    }
    
    // In a real implementation, you would use Claude or another AI to process
    // the scene according to the instructions and generate new content.
    // For this sample implementation, we'll just append the instructions 
    // as a placeholder.
    
    const processedContent = scene.content + '\n\n/* ' +
      `These instructions would be applied by Claude: ${instructions}` +
      ' */';
    
    // Create a new version with the processed content
    const result = await createSceneVersion({
      scene_id,
      content: processedContent,
      notes: `Processed with instructions: ${instructions}`
    });
    
    return {
      success: result.success,
      scene: result.scene,
      version: result.version,
      instructions,
      message: `Successfully processed scene "${scene.title}" according to instructions`
    };
  } catch (error) {
    console.error('Error in process_scene:', error);
    throw error;
  }
}

/**
 * Creates a new scene version that addresses specified comments
 * 
 * @param {object} args - The function arguments
 * @returns {object} Updated scene data
 */
async function addressSceneComments(args) {
  try {
    const {
      scene_id,
      comment_ids = null // If null, address all unresolved comments
    } = args;
    
    // Validate required fields
    if (!scene_id) {
      throw new Error("Scene ID is required");
    }
    
    // Get the current scene
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', scene_id)
      .single();
    
    if (sceneError || !scene) {
      throw new Error(`Scene with ID ${scene_id} not found`);
    }
    
    // Get comments to address
    let commentsQuery = supabase
      .from('scene_comments')
      .select('*')
      .eq('scene_id', scene_id)
      .eq('resolved', false);
    
    if (comment_ids) {
      commentsQuery = commentsQuery.in('id', comment_ids);
    }
    
    const { data: comments, error: commentsError } = await commentsQuery;
    
    if (commentsError) throw commentsError;
    
    if (comments.length === 0) {
      return {
        success: false,
        message: "No unresolved comments found to address"
      };
    }
    
    // In a real implementation, you would use Claude or another AI to modify
    // the scene content to address each comment. For this sample, we'll
    // just annotate the current content.
    
    let processedContent = scene.content;
    const addressedComments = [];
    
    comments.forEach(comment => {
      const commentMarker = `\n\n/* ADDRESSED COMMENT: ${comment.content} */\n`;
      processedContent += commentMarker;
      addressedComments.push(comment.id);
    });
    
    // Create a new version with the processed content
    const result = await createSceneVersion({
      scene_id,
      content: processedContent,
      notes: `Addressed ${comments.length} comment(s)`
    });
    
    // Mark comments as resolved
    if (addressedComments.length > 0) {
      await supabase
        .from('scene_comments')
        .update({ resolved: true })
        .in('id', addressedComments);
    }
    
    return {
      success: result.success,
      scene: result.scene,
      version: result.version,
      addressed_comments: comments.length,
      comment_ids: addressedComments,
      message: `Successfully addressed ${comments.length} comment(s) in scene "${scene.title}"`
    };
  } catch (error) {
    console.error('Error in address_scene_comments:', error);
    throw error;
  }
}

/**
 * Exports a complete project as a single document
 * 
 * @param {object} args - The function arguments
 * @returns {object} Exported project text
 */
async function exportProject(args) {
  try {
    const {
      project_id, // StoryVerse uses story_id
      format = 'text',
      include_types = null
    } = args;
    
    // Map project_id to story_id for consistency
    const story_id = project_id;
    
    // Validate required fields
    if (!story_id) {
      throw new Error("Project/Story ID is required");
    }
    
    // Get the story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', story_id)
      .single();
    
    if (storyError || !story) {
      throw new Error(`Story with ID ${story_id} not found`);
    }
    
    // Query for all scenes
    let sceneQuery = supabase
      .from('scenes')
      .select('*')
      .eq('story_id', story_id)
      .eq('is_visible', true)
      .order('sequence_number', { ascending: true });
    
    if (include_types && include_types.length > 0) {
      sceneQuery = sceneQuery.in('type', include_types);
    }
    
    const { data: scenes, error: scenesError } = await sceneQuery;
    
    if (scenesError) throw scenesError;
    
    // Generate the export content based on format
    let content = '';
    
    if (format === 'markdown') {
      content = `# ${story.title}\n\n`;
      
      if (story.description) {
        content += `${story.description}\n\n`;
      }
      
      scenes.forEach((scene, index) => {
        content += `## ${scene.title}\n\n`;
        content += `${scene.content}\n\n`;
        
        if (index < scenes.length - 1) {
          content += '---\n\n';
        }
      });
    } 
    else if (format === 'html') {
      content = `<!DOCTYPE html>
<html>
<head>
  <title>${escapeHtml(story.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; }
    h2 { margin-top: 2em; border-bottom: 1px solid #ddd; }
    .scene { margin-bottom: 2em; }
    .scene-divider { text-align: center; margin: 2em 0; }
    .scene-content { white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>${escapeHtml(story.title)}</h1>`;

      if (story.description) {
        content += `\n  <p>${escapeHtml(story.description)}</p>`;
      }
      
      scenes.forEach((scene, index) => {
        content += `\n  <div class="scene">
    <h2>${escapeHtml(scene.title)}</h2>
    <div class="scene-content">${escapeHtml(scene.content)}</div>
  </div>`;
        
        if (index < scenes.length - 1) {
          content += '\n  <div class="scene-divider">* * *</div>';
        }
      });
      
      content += '\n</body>\n</html>';
    } 
    else {
      // Default to plain text
      content = `${story.title.toUpperCase()}\n\n`;
      
      if (story.description) {
        content += `${story.description}\n\n`;
      }
      
      scenes.forEach((scene, index) => {
        content += `${scene.title.toUpperCase()}\n\n`;
        content += `${scene.content}\n\n`;
        
        if (index < scenes.length - 1) {
          content += '* * *\n\n';
        }
      });
    }
    
    return {
      success: true,
      story: {
        id: story.id,
        title: story.title
      },
      scenes: scenes.map(s => ({ id: s.id, title: s.title })),
      scene_count: scenes.length,
      format,
      content,
      message: `Successfully exported ${scenes.length} scenes from "${story.title}"`
    };
  } catch (error) {
    console.error('Error in export_project:', error);
    throw error;
  }
}

/**
 * Exports scenes in Fountain format for screenplay formatting
 * 
 * @param {object} args - The function arguments
 * @returns {object} Fountain formatted screenplay
 */
async function exportFountain(args) {
  try {
    const {
      project_id, // StoryVerse uses story_id
      scene_ids = null,
      include_title_page = true
    } = args;
    
    // Map project_id to story_id for consistency
    const story_id = project_id;
    
    // Validate required fields
    if (!story_id) {
      throw new Error("Project/Story ID is required");
    }
    
    // Get the story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', story_id)
      .single();
    
    if (storyError || !story) {
      throw new Error(`Story with ID ${story_id} not found`);
    }
    
    // Query for scenes
    let sceneQuery = supabase
      .from('scenes')
      .select('*')
      .eq('story_id', story_id)
      .eq('is_visible', true)
      .order('sequence_number', { ascending: true });
    
    if (scene_ids && scene_ids.length > 0) {
      sceneQuery = sceneQuery.in('id', scene_ids);
    }
    
    const { data: scenes, error: scenesError } = await sceneQuery;
    
    if (scenesError) throw scenesError;
    
    // Generate Fountain screenplay
    let content = '';
    
    // Add title page if requested
    if (include_title_page) {
      content += `Title: ${story.title}\n`;
      
      if (story.description) {
        content += `Logline: ${story.description.split('\n')[0]}\n`;
      }
      
      // Add other standard title page elements
      const now = new Date();
      content += `Draft date: ${now.toLocaleDateString()}\n`;
      content += `\n\n`;
    }
    
    // Process each scene
    scenes.forEach((scene, index) => {
      // For scenes already in Fountain format, include as-is
      if (scene.format === 'fountain') {
        content += scene.content;
      } else {
        // Convert scene to basic Fountain format
        content += convertToFountain(scene);
      }
      
      // Add a newline between scenes
      if (index < scenes.length - 1) {
        content += '\n\n';
      }
    });
    
    return {
      success: true,
      story: {
        id: story.id,
        title: story.title
      },
      scenes: scenes.map(s => ({ id: s.id, title: s.title })),
      scene_count: scenes.length,
      content,
      message: `Successfully exported ${scenes.length} scenes in Fountain format from "${story.title}"`
    };
  } catch (error) {
    console.error('Error in export_fountain:', error);
    throw error;
  }
}

/**
 * Helper function to convert scene content to Fountain format
 */
function convertToFountain(scene) {
  let fountain = '';
  
  // Add scene heading if it doesn't exist
  if (!scene.content.match(/^(INT|EXT|INT\.\/EXT\.|INT\/EXT|I\/E)[. ]/m)) {
    fountain += `\n\n# ${scene.title}\n\n`;
    fountain += 'INT. UNSPECIFIED LOCATION - DAY\n\n';
  }
  
  // Basic conversion of content
  const lines = scene.content.split('\n');
  let inDialogue = false;
  let inAction = true;
  
  lines.forEach(line => {
    line = line.trim();
    
    // Skip empty lines
    if (line === '') {
      fountain += '\n';
      inAction = true;
      inDialogue = false;
      return;
    }
    
    // Check for character cues (all caps lines)
    if (line === line.toUpperCase() && line.length > 1 && line.length < 50 && !line.startsWith('INT') && !line.startsWith('EXT')) {
      fountain += `\n${line}\n`;
      inDialogue = true;
      inAction = false;
    }
    // Check for parentheticals
    else if (line.startsWith('(') && line.endsWith(')') && line.length < 50) {
      fountain += `${line}\n`;
    }
    // Handle dialogue or action
    else {
      if (inDialogue) {
        fountain += `${line}\n`;
      } else {
        if (!inAction) {
          fountain += '\n';
        }
        fountain += `${line}\n`;
        inAction = true;
      }
    }
  });
  
  return fountain;
}

    // ======================================================
    // NARRATIVE STRUCTURE TOOLS
    // ======================================================
    
    // Handle get_character_journey
    if (name === 'get_character_journey') {
      const result = await getCharacterJourney(args);
      
      let responseText = `# Character Journey: ${result.character ? result.character.name : 'Character'}\n\n`;
      responseText += `Found ${result.journey.length} events in this character's journey.\n\n`;
      
      if (result.journey.length > 0) {
        responseText += "## Events in Sequence\n\n";
        
        result.journey.forEach((event, index) => {
          responseText += `### ${index + 1}. ${event.title}\n`;
          responseText += `**Importance:** ${event.importance}/10 | **Experience:** ${event.experience_type}\n\n`;
          responseText += `${event.description}\n\n`;
          if (event.notes) {
            responseText += `*Note: ${event.notes}*\n\n`;
          }
        });
      }
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    // Handle compare_character_journeys
    if (name === 'compare_character_journeys') {
      const result = await compareCharacterJourneys(args);
      
      let responseText = `# Character Journey Comparison\n\n`;
      responseText += `Comparing journeys of ${result.journeys.length} characters with ${result.shared_events.length} shared events.\n\n`;
      
      // List characters being compared
      responseText += "## Characters\n\n";
      result.journeys.forEach(journey => {
        responseText += `- **${journey.character.name}**: ${journey.event_count} events\n`;
      });
      
      // Show shared events
      if (result.shared_events.length > 0) {
        responseText += "\n## Shared Events\n\n";
        
        result.shared_events.forEach((item, index) => {
          responseText += `### ${index + 1}. ${item.event.title}\n`;
          responseText += `Shared by: ${item.characters.map(c => c.name).join(', ')}\n\n`;
          responseText += `${item.event.description}\n\n`;
          
          // Character-specific perspectives
          responseText += "**Character Perspectives:**\n";
          item.characters.forEach(char => {
            responseText += `- ${char.name}: ${char.experience_type}, importance ${char.importance}/10\n`;
          });
          responseText += "\n";
        });
      }
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    // Handle update_event_sequence
    if (name === 'update_event_sequence') {
      const result = await updateEventSequence(args);
      
      let responseText;
      if (result.success) {
        responseText = `Successfully updated event sequence number from ${result.previous_sequence_number} to ${result.event.sequence_number}.`;
      } else {
        responseText = `Failed to update event sequence due to dependency violations.\n\n`;
        result.violations.forEach((violation, index) => {
          responseText += `Violation ${index + 1}: ${violation.message}\n`;
          if (violation.type === 'successor_before_predecessor') {
            responseText += `The successor event "${violation.successor_event_id}" has sequence number ${violation.successor_sequence}, which would be before the new position.\n\n`;
          } else {
            responseText += `The predecessor event "${violation.predecessor_event_id}" has sequence number ${violation.predecessor_sequence}, which would be after the new position.\n\n`;
          }
        });
      }
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    // Handle normalize_event_sequence
    if (name === 'normalize_event_sequence') {
      const result = await normalizeEventSequence(args);
      
      let responseText = result.message + "\n\n";
      
      if (result.events_normalized > 0) {
        responseText += `Events now have sequence numbers ranging from ${result.first_event.new_sequence} to ${result.last_event.new_sequence}, with consistent spacing between them.`;
      }
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    // Handle create_story_event
    if (name === 'create_story_event') {
      const result = await createStoryEvent(args);
      
      let responseText = `Successfully created event "${result.event.title}" with sequence number ${result.event.sequence_number}.\n\n`;
      
      if (result.dependencies && result.dependencies.length > 0) {
        responseText += `Added ${result.dependencies.length} dependency relationships to this event.`;
      }
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    // Handle add_event_with_dependencies
    if (name === 'add_event_with_dependencies') {
      const result = await addEventWithDependencies(args);
      
      let responseText = `Successfully created event "${result.event.title}" with sequence number ${result.event.sequence_number}.\n\n`;
      
      if (result.dependencies && result.dependencies.length > 0) {
        responseText += `Added ${result.dependencies.length} dependency relationships to position this event correctly in the sequence.`;
      }
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    // Handle add_character_event
    if (name === 'add_character_event') {
      const result = await addCharacterEvent(args);
      
      let responseText = `Successfully created event "${result.event.title}" and added it to the character's journey at position ${result.character_event.character_sequence_number}.`;
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
// Handle find_shared_events
    if (name === 'find_shared_events') {
      const result = await findSharedEvents(args);
      
      let responseText = `# Shared Events\n\n`;
      responseText += `Found ${result.events.length} events shared among the selected characters.\n\n`;
      
      if (result.events.length > 0) {
        responseText += "## Event Details\n\n";
        
        result.events.forEach((event, index) => {
          responseText += `### ${index + 1}. ${event.title}\n`;
          responseText += `**Shared by:** ${event.characters.map(c => c.name).join(', ')} (${event.shared_by} characters)\n\n`;
          responseText += `${event.description || 'No description available.'}\n\n`;
          
          responseText += "**Character Involvement:**\n";
          event.characters.forEach(char => {
            responseText += `- ${char.name}: ${char.experience_type || 'unspecified'}, importance ${char.importance}/10\n`;
          });
          responseText += "\n";
        });
      }
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    // Handle add_scene_with_events
    if (name === 'add_scene_with_events') {
      const result = await addSceneWithEvents(args);
      
      let responseText = `Successfully created scene "${result.scene.title}" `;
      
      if (result.event.title.startsWith('Event: ')) {
        responseText += `with a new corresponding event "${result.event.title}".\n\n`;
      } else {
        responseText += `connected to event "${result.event.title}".\n\n`;
      }
      
      if (result.scene_characters && result.scene_characters.length > 0) {
        responseText += `Added ${result.scene_characters.length} characters to this scene.\n`;
      }
      
      if (result.scene_locations && result.scene_locations.length > 0) {
        responseText += `Added ${result.scene_locations.length} locations to this scene.\n`;
      }
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    // Handle visualize_timeline
    if (name === 'visualize_timeline') {
      const result = await visualizeTimeline(args);
      
      let responseText = `# Timeline Visualization\n\n`;
      
      if (result.type === 'react-flow') {
        const nodeCount = result.elements.nodes.length;
        const edgeCount = result.elements.edges.length;
        
        responseText += `Generated a React Flow visualization with ${nodeCount} events and ${edgeCount} connections.\n\n`;
        responseText += `This data can be used with React Flow to create an interactive diagram of your story's events and their dependencies.`;
      } 
      else if (result.type === 'timeline') {
        responseText += `Generated a timeline visualization with ${result.items.length} events.\n\n`;
        responseText += `This data can be used with TimelineJS to create a chronological view of your story's events.`;
      }
      else {
        const eventCount = result.events.length;
        const dependencyCount = result.dependencies.length;
        
        responseText += `Generated structured data with ${eventCount} events and ${dependencyCount} dependencies.\n\n`;
        responseText += `This data can be used to build a custom visualization of your story structure.`;
      }
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    // Handle analyze_event_impact
    if (name === 'analyze_event_impact') {
      const result = await analyzeEventImpact(args);
      
      let responseText = `# Event Impact Analysis: "${result.event.title}"\n\n`;
      responseText += `Significance Score: ${result.impact.significance}/10\n\n`;
      
      // Character impact
      responseText += "## Character Impact\n\n";
      
      if (result.characters.primary.length > 0) {
        responseText += "### Primary Characters\n";
        result.characters.primary.forEach(char => {
          responseText += `- ${char.name} (${char.role || 'unknown role'})\n`;
        });
        responseText += "\n";
      }
      
      if (result.characters.secondary.length > 0) {
        responseText += "### Secondary Characters\n";
        result.characters.secondary.forEach(char => {
          responseText += `- ${char.name} (${char.role || 'unknown role'})\n`;
        });
        responseText += "\n";
      }
      
      // Causes and effects
      responseText += "## Causal Relationships\n\n";
      
      if (result.causes.length > 0) {
        responseText += "### Caused By\n";
        result.causes.forEach(cause => {
          responseText += `- ${cause.title} (${cause.relationship}, strength: ${cause.strength}/10)\n`;
        });
        responseText += "\n";
      }
      
      if (result.effects.length > 0) {
        responseText += "### Causes\n";
        result.effects.forEach(effect => {
          responseText += `- ${effect.title} (${effect.relationship}, strength: ${effect.strength}/10)\n`;
        });
        responseText += "\n";
      }
      
      // Scenes
      if (result.scenes.length > 0) {
        responseText += "## Scenes\n";
        result.scenes.forEach(scene => {
          responseText += `- ${scene.title}\n`;
        });
        responseText += "\n";
      }
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    // Handle detect_dependency_conflicts
    if (name === 'detect_dependency_conflicts') {
      const result = await detectDependencyConflicts(args);
      
      let responseText = `# Dependency Conflict Analysis\n\n`;
      responseText += `Analyzed ${result.events_analyzed} events with ${result.dependencies_analyzed} dependencies.\n\n`;
      
      if (result.has_conflicts) {
        responseText += "## Issues Detected\n\n";
        
        if (result.issues.sequence_conflicts.length > 0) {
          responseText += "### Sequence Order Conflicts\n";
          responseText += "These events have dependency relationships that conflict with their sequence order:\n\n";
          
          result.issues.sequence_conflicts.forEach((conflict, index) => {
            responseText += `${index + 1}. **${conflict.predecessor.title}** (sequence ${conflict.predecessor.sequence_number}) → `;
            responseText += `**${conflict.successor.title}** (sequence ${conflict.successor.sequence_number})\n`;
            responseText += `   *Problem:* ${conflict.message}\n\n`;
          });
        }
        
        if (result.issues.circular_dependencies.length > 0) {
          responseText += "### Circular Dependencies\n";
          responseText += "These events form circular dependency chains:\n\n";
          
          result.issues.circular_dependencies.forEach((conflict, index) => {
            responseText += `${index + 1}. Cycle: ${conflict.events_involved.map(e => e.title).join(' → ')} → (back to start)\n\n`;
          });
        }
        
        if (result.issues.orphaned_events.length > 0) {
          responseText += "### Orphaned Events\n";
          responseText += "These events have no connections to other events:\n\n";
          
          result.issues.orphaned_events.forEach((event, index) => {
            responseText += `${index + 1}. **${event.title}**\n`;
          });
        }
      } else {
        responseText += "No conflicts detected! Your event dependencies appear to be consistent.";
      }
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    // Handle suggest_missing_events
    if (name === 'suggest_missing_events') {
      const result = await suggestMissingEvents(args);
      
      let responseText = `# Missing Events Analysis\n\n`;
      responseText += `Analyzed ${result.events_analyzed} events in the story.\n\n`;
      
      if (result.has_suggestions) {
        responseText += "## Suggested Additions\n\n";
        
        result.suggestions.forEach(suggestion => {
          responseText += `### ${suggestion.type === 'sequence_gaps' ? 'Sequence Gaps' : 
                               suggestion.type === 'causal_jumps' ? 'Causal Chain Gaps' : 
                               'Character Journey Gaps'}\n`;
          responseText += `${suggestion.message}\n\n`;
          
          if (suggestion.type === 'sequence_gaps') {
            suggestion.gaps.forEach((gap, index) => {
              responseText += `${index + 1}. Gap between "${gap.position.after.title}" and "${gap.position.before.title}"\n`;
              responseText += `   *Sequence numbers:* ${gap.position.after.sequence_number} → ${gap.position.before.sequence_number}\n`;
              responseText += `   *Gap size:* ${gap.gap_size}\n\n`;
            });
          } 
          else if (suggestion.type === 'causal_jumps') {
            suggestion.chains.forEach((chain, index) => {
              responseText += `${index + 1}. Direct causal jump: "${chain.events[0].title}" → "${chain.events[1].title}"\n`;
              responseText += `   *Suggestion:* Consider adding intermediate events in this causal chain\n\n`;
            });
          }
          else if (suggestion.type === 'character_journey_gaps') {
            suggestion.gaps.forEach((gap, index) => {
              responseText += `${index + 1}. Gap in ${gap.character.name}'s journey between "${gap.position.after.title}" and "${gap.position.before.title}"\n`;
              responseText += `   *Suggestion:* Character disappears for a significant portion of the story\n\n`;
            });
          }
        });
      } else {
        responseText += "No significant gaps detected in your story structure!";
      }
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    // Handle analyze_story
    if (name === 'analyze_story') {
      const result = await analyzeStory(args);
      
      let responseText = `# Story Analysis: "${result.story_title}"\n\n`;
      responseText += `Successfully analyzed your story and extracted the following elements:\n\n`;
      
      responseText += `- **Characters:** ${result.extracted.characters.length}\n`;
      responseText += `- **Locations:** ${result.extracted.locations.length}\n`;
      responseText += `- **Events:** ${result.extracted.events.length}\n`;
      responseText += `- **Scenes:** ${result.extracted.scenes.length}\n`;
      responseText += `- **Dependencies:** ${result.extracted.dependencies.length}\n\n`;
      
      // List top characters
      if (result.extracted.characters.length > 0) {
        responseText += "## Main Characters\n";
        const topCharacters = result.extracted.characters.slice(0, Math.min(5, result.extracted.characters.length));
        topCharacters.forEach(char => {
          responseText += `- ${char.name}\n`;
        });
        responseText += "\n";
      }
      
      // List top locations
      if (result.extracted.locations.length > 0) {
        responseText += "## Key Locations\n";
        const topLocations = result.extracted.locations.slice(0, Math.min(5, result.extracted.locations.length));
        topLocations.forEach(loc => {
          responseText += `- ${loc.name}\n`;
        });
        responseText += "\n";
      }
      
      responseText += "## Next Steps\n";
      responseText += "Now that your story has been processed, you can use other tools to:\n\n";
      responseText += "1. View character journeys with `get_character_journey`\n";
      responseText += "2. Analyze event impacts with `analyze_event_impact`\n";
      responseText += "3. Visualize the timeline with `visualize_timeline`\n";
      responseText += "4. Check for structural issues with `detect_dependency_conflicts`\n";
      responseText += "5. Get suggestions for missing events with `suggest_missing_events`\n";
      
      return {
        content: [
          {
            type: "text",
            text: responseText,
          },
          {
            type: "json",
            json: result
          }
        ],
      };
    }
    
    
    // Handle setup_story_world
if (name === 'setup_story_world') {
  const result = await setupStoryWorld(args);
  
  return {
    content: [
      {
        type: "text",
        text: result.message,
      },
      {
        type: "json",
        json: result
      }
    ],
  };
}

// Handle setup_series
if (name === 'setup_series') {
  const result = await setupSeries(args);
  
  return {
    content: [
      {
        type: "text",
        text: result.message,
      },
      {
        type: "json",
        json: result
      }
    ],
  };
}

// Handle setup_story
if (name === 'setup_story') {
  const result = await setupStory(args);
  
  return {
    content: [
      {
        type: "text",
        text: result.message,
      },
      {
        type: "json",
        json: result
      }
    ],
  };
}

// Handle create_character
if (name === 'create_character') {
  const result = await createCharacter(args);
  
  return {
    content: [
      {
        type: "text",
        text: result.message,
      },
      {
        type: "json",
        json: result
      }
    ],
  };
}

// Handle create_location
if (name === 'create_location') {
  const result = await createLocation(args);
  
  return {
    content: [
      {
        type: "text",
        text: result.message,
      },
      {
        type: "json",
        json: result
      }
    ],
  };
}

// Handle create_faction
if (name === 'create_faction') {
  const result = await createFaction(args);
  
  return {
    content: [
      {
        type: "text",
        text: result.message,
      },
      {
        type: "json",
        json: result
      }
    ],
  };
}

// Handle create_relationship
if (name === 'create_relationship') {
  const result = await createRelationship(args);
  
  return {
    content: [
      {
        type: "text",
        text: result.message,
      },
      {
        type: "json",
        json: result
      }
    ],
  };
}

// Handle create_item
if (name === 'create_item') {
  const result = await createItem(args);
  
  return {
    content: [
      {
        type: "text",
        text: result.message,
      },
      {
        type: "json",
        json: result
      }
    ],
  };
}

// Handle create_character_arc
if (name === 'create_character_arc') {
  const result = await createCharacterArc(args);
  
  return {
    content: [
      {
        type: "text",
        text: result.message,
      },
      {
        type: "json",
        json: result
      }
    ],
  };
}

// Handle create_plotline
if (name === 'create_plotline') {
  const result = await createPlotline(args);
  
  return {
    content: [
      {
        type: "text",
        text: result.message,
      },
      {
        type: "json",
        json: result
      }
    ],
  };
}


    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    console.error("Error in call_tool handler:", error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Create function to run SQL script against Supabase
const runSqlSetup = async () => {
  try {
    console.error("Running database setup script...");
    const fs = require('fs');
    const sqlScript = fs.readFileSync('./db-updates.sql', 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      const { error } = await supabase.rpc('run_sql', { sql: statement + ';' });
      if (error) {
        console.error(`Error running SQL: ${error.message}`);
        // Continue with other statements even if one fails
      }
    }
    
    console.error("Database setup complete");
  } catch (error) {
    console.error(`Error setting up database: ${error.message}`);
    // Continue with server startup even if DB setup fails
  }
};

// Start server with DB initialization
async function runServer() {
  try {
    console.error("Starting MCP server...");
    
    // Try to run database setup
    await runSqlSetup().catch(err => console.error("DB setup error:", err));
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("StoryVerse MCP Server running with database access");
  } catch (error) {
    console.error("Fatal error running server:", error);
    process.exit(1);
  }
}

runServer();