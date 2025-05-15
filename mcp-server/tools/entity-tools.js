/**
 * Entity Creation Tool Definitions
 */

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

export default { 
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
};