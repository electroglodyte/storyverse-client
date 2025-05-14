/**
 * This file defines the tools available in the StoryVerse MCP server
 * Version: 0.3.0
 * 
 * STYLE ANALYSIS TOOLS
 */

interface AnalyzeWritingSampleTool {
  name: "analyze_writing_sample";
  description: "Analyzes a text sample to identify writing style characteristics and patterns";
}

interface GetStyleProfileTool {
  name: "get_style_profile";
  description: "Retrieves a writing style profile with guidance for writing in that style";
}

interface CreateStyleProfileTool {
  name: "create_style_profile";
  description: "Creates or updates a style profile based on analyzed writing samples";
}

interface WriteInStyleTool {
  name: "write_in_style";
  description: "Instructs Claude to write text following a specific style profile";
}

/**
 * NARRATIVE STRUCTURE TOOLS
 */

interface GetCharacterJourneyTool {
  name: "get_character_journey";
  description: "Retrieves a character's complete journey of events in sequence order";
}

interface CompareCharacterJourneysTool {
  name: "compare_character_journeys";
  description: "Compare multiple characters' journeys, highlighting shared events and interactions";
}

interface UpdateEventSequenceTool {
  name: "update_event_sequence";
  description: "Safely updates an event's sequence number, maintaining dependencies";
}

interface NormalizeEventSequenceTool {
  name: "normalize_event_sequence";
  description: "Normalizes event sequence numbers to be evenly distributed";
}

interface CreateStoryEventTool {
  name: "create_story_event";
  description: "Creates a new story event with optional dependencies";
}

interface AddEventWithDependenciesTool {
  name: "add_event_with_dependencies";
  description: "Adds an event with multiple dependencies and proper positioning in the sequence";
}

interface AddCharacterEventTool {
  name: "add_character_event";
  description: "Adds an event to a character's journey";
}

interface FindSharedEventsTool {
  name: "find_shared_events";
  description: "Find events shared between multiple characters";
}

interface AddSceneWithEventsTool {
  name: "add_scene_with_events";
  description: "Creates a scene and optionally a corresponding event";
}

interface VisualizeTimelineTool {
  name: "visualize_timeline";
  description: "Generates a visual representation of events and their relationships";
}

interface AnalyzeEventImpactTool {
  name: "analyze_event_impact";
  description: "Analyzes how an event impacts characters and the story";
}

interface DetectDependencyConflictsTool {
  name: "detect_dependency_conflicts";
  description: "Detects logical inconsistencies in event dependencies";
}

interface SuggestMissingEventsTool {
  name: "suggest_missing_events";
  description: "Suggests potential missing events in a story";
}

interface AnalyzeStoryTool {
  name: "analyze_story";
  description: "Master function for analyzing an entire story and populating database";
}

/**
 * ENTITY CREATION TOOLS
 */

interface SetupStoryWorldTool {
  name: "setup_story_world";
  description: "Set up a new story world";
}

interface SetupSeriesTool {
  name: "setup_series";
  description: "Set up a new series and optionally link it to a story world";
}

interface SetupStoryTool {
  name: "setup_story";
  description: "Set up a new story and optionally link it to a story world or series";
}

interface CreateCharacterTool {
  name: "create_character";
  description: "Create a new character and optionally link it to a story world or story";
}

interface CreateLocationTool {
  name: "create_location";
  description: "Create a new location and optionally link it to a story world or story";
}

interface CreateFactionTool {
  name: "create_faction";
  description: "Create a new faction and optionally link it to a story world or story";
}

interface CreateRelationshipTool {
  name: "create_relationship";
  description: "Create a relationship between two characters";
}

interface CreateItemTool {
  name: "create_item";
  description: "Create a new item/artifact in the story world";
}

interface CreateCharacterArcTool {
  name: "create_character_arc";
  description: "Create a character development arc for a story";
}

interface CreatePlotlineTool {
  name: "create_plotline";
  description: "Create a plotline for a story";
}

// Combined type representing all available tools
type McpTool = 
  | AnalyzeWritingSampleTool
  | GetStyleProfileTool
  | CreateStyleProfileTool
  | WriteInStyleTool
  | GetCharacterJourneyTool
  | CompareCharacterJourneysTool
  | UpdateEventSequenceTool
  | NormalizeEventSequenceTool
  | CreateStoryEventTool
  | AddEventWithDependenciesTool
  | AddCharacterEventTool
  | FindSharedEventsTool
  | AddSceneWithEventsTool
  | VisualizeTimelineTool
  | AnalyzeEventImpactTool
  | DetectDependencyConflictsTool
  | SuggestMissingEventsTool
  | AnalyzeStoryTool
  | SetupStoryWorldTool
  | SetupSeriesTool
  | SetupStoryTool
  | CreateCharacterTool
  | CreateLocationTool
  | CreateFactionTool
  | CreateRelationshipTool
  | CreateItemTool
  | CreateCharacterArcTool
  | CreatePlotlineTool;

// Export as a constant array of all available tools
export const MCP_TOOLS: McpTool[] = [
  { name: "analyze_writing_sample", description: "Analyzes a text sample to identify writing style characteristics and patterns" },
  { name: "get_style_profile", description: "Retrieves a writing style profile with guidance for writing in that style" },
  { name: "create_style_profile", description: "Creates or updates a style profile based on analyzed writing samples" },
  { name: "write_in_style", description: "Instructs Claude to write text following a specific style profile" },
  { name: "get_character_journey", description: "Retrieves a character's complete journey of events in sequence order" },
  { name: "compare_character_journeys", description: "Compare multiple characters' journeys, highlighting shared events and interactions" },
  { name: "update_event_sequence", description: "Safely updates an event's sequence number, maintaining dependencies" },
  { name: "normalize_event_sequence", description: "Normalizes event sequence numbers to be evenly distributed" },
  { name: "create_story_event", description: "Creates a new story event with optional dependencies" },
  { name: "add_event_with_dependencies", description: "Adds an event with multiple dependencies and proper positioning in the sequence" },
  { name: "add_character_event", description: "Adds an event to a character's journey" },
  { name: "find_shared_events", description: "Find events shared between multiple characters" },
  { name: "add_scene_with_events", description: "Creates a scene and optionally a corresponding event" },
  { name: "visualize_timeline", description: "Generates a visual representation of events and their relationships" },
  { name: "analyze_event_impact", description: "Analyzes how an event impacts characters and the story" },
  { name: "detect_dependency_conflicts", description: "Detects logical inconsistencies in event dependencies" },
  { name: "suggest_missing_events", description: "Suggests potential missing events in a story" },
  { name: "analyze_story", description: "Master function for analyzing an entire story and populating database" },
  { name: "setup_story_world", description: "Set up a new story world" },
  { name: "setup_series", description: "Set up a new series and optionally link it to a story world" },
  { name: "setup_story", description: "Set up a new story and optionally link it to a story world or series" },
  { name: "create_character", description: "Create a new character and optionally link it to a story world or story" },
  { name: "create_location", description: "Create a new location and optionally link it to a story world or story" },
  { name: "create_faction", description: "Create a new faction and optionally link it to a story world or story" },
  { name: "create_relationship", description: "Create a relationship between two characters" },
  { name: "create_item", description: "Create a new item/artifact in the story world" },
  { name: "create_character_arc", description: "Create a character development arc for a story" },
  { name: "create_plotline", description: "Create a plotline for a story" }
];