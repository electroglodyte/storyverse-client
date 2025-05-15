/**
 * Narrative Structure Tool Definitions
 */

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

export default {
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
  analyzeStoryTool
};