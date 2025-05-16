/**
 * This file defines the tools available in the StoryVerse MCP server
 * Version: 0.8.6
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

interface CreateObjectTool {
  name: "create_object";
  description: "Create a new object (prop) and optionally link it to a story world or story";
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

/**
 * SCENE MANAGEMENT TOOLS
 */

interface ImportSceneTool {
  name: "import_scene";
  description: "Imports a new scene into the StoryVerse system";
}

interface ImportTextTool {
  name: "import_text";
  description: "Imports and optionally parses a full text into multiple scenes";
}

interface CreateSceneVersionTool {
  name: "create_scene_version";
  description: "Creates a new version of an existing scene";
}

interface GetSceneVersionsTool {
  name: "get_scene_versions";
  description: "Retrieves version history for a scene";
}

interface RestoreSceneVersionTool {
  name: "restore_scene_version";
  description: "Restores a scene to a previous version";
}

interface CompareSceneVersionsTool {
  name: "compare_scene_versions";
  description: "Creates a detailed comparison between two scene versions";
}

interface AddSceneCommentTool {
  name: "add_scene_comment";
  description: "Adds a comment to a scene";
}

interface ResolveSceneCommentTool {
  name: "resolve_scene_comment";
  description: "Marks a comment as resolved or unresolved";
}

interface ProcessSceneTool {
  name: "process_scene";
  description: "Processes a scene according to instructions, creating a new version";
}

interface AddressSceneCommentsTool {
  name: "address_scene_comments";
  description: "Creates a new scene version that addresses specified comments";
}

interface ExportProjectTool {
  name: "export_project";
  description: "Exports a complete project as a single document";
}

interface ExportFountainTool {
  name: "export_fountain";
  description: "Exports scenes in Fountain format, with proper screenplay formatting";
}

/**
 * SCENE TOOLS
 */

interface SplitSceneTool {
  name: "split_scene";
  description: "Splits a scene into multiple scenes at specified positions";
}

interface CombineScenesTool {
  name: "combine_scenes";
  description: "Combines multiple scenes into a single scene";
}

interface SceneToWritingSampleTool {
  name: "scene_to_writing_sample";
  description: "Creates a writing sample from a scene's content";
}

interface DetectStorylinesTool {
  name: "detect_storylines";
  description: "Analyzes a story's content and structure to identify distinct storylines and plot arcs";
}

/**
 * SCENE METADATA TOOLS
 */

interface UpdateSceneCreationNotesTool {
  name: "update_scene_creation_notes";
  description: "Adds or updates creation notes for a scene with timestamps";
}

interface GenerateCharacter5QTool {
  name: "generate_character_5q";
  description: "Analyzes a scene and generates 5Q answers for each character";
}

interface UpdateCharacter5QTool {
  name: "update_character_5q";
  description: "Updates the 5Q answers for a specific character in a scene";
}

interface AnalyzeSceneSubtextTool {
  name: "analyze_scene_subtext";
  description: "Analyzes a scene and suggests possible subtexts";
}

interface UpdateSceneSubtextTool {
  name: "update_scene_subtext";
  description: "Updates the subtext notes for a scene";
}

/**
 * IMPORT TOOLS
 */

interface ImportAnalyzedStoryTool {
  name: "import_analyzed_story";
  description: "Imports pre-analyzed story data (produced by Claude) into the database, handling entity relationships and deduplication";
}

/**
 * OBJECT (PROPS) TOOLS
 */

interface LinkObjectToCharacterTool {
  name: "link_object_to_character";
  description: "Establishes a relationship between an object and a character";
}

interface LinkObjectToLocationTool {
  name: "link_object_to_location";
  description: "Establishes a relationship between an object and a location";
}

interface TrackObjectAppearanceTool {
  name: "track_object_appearance";
  description: "Records an appearance of an object in a scene or event";
}

interface AnalyzeObjectUsageTool {
  name: "analyze_object_usage";
  description: "Analyzes how objects are used throughout a story";
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
  | SetupStoryWorldTool
  | SetupSeriesTool
  | SetupStoryTool
  | CreateCharacterTool
  | CreateLocationTool
  | CreateFactionTool
  | CreateObjectTool
  | CreateRelationshipTool
  | CreateItemTool
  | CreateCharacterArcTool
  | CreatePlotlineTool
  | ImportSceneTool
  | ImportTextTool
  | CreateSceneVersionTool
  | GetSceneVersionsTool
  | RestoreSceneVersionTool
  | CompareSceneVersionsTool
  | AddSceneCommentTool
  | ResolveSceneCommentTool
  | ProcessSceneTool
  | AddressSceneCommentsTool
  | ExportProjectTool
  | ExportFountainTool
  | SplitSceneTool
  | CombineScenesTool
  | SceneToWritingSampleTool
  | DetectStorylinesTool
  | UpdateSceneCreationNotesTool
  | GenerateCharacter5QTool
  | UpdateCharacter5QTool
  | AnalyzeSceneSubtextTool
  | UpdateSceneSubtextTool
  | ImportAnalyzedStoryTool
  | LinkObjectToCharacterTool
  | LinkObjectToLocationTool
  | TrackObjectAppearanceTool
  | AnalyzeObjectUsageTool;

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
  { name: "setup_story_world", description: "Set up a new story world" },
  { name: "setup_series", description: "Set up a new series and optionally link it to a story world" },
  { name: "setup_story", description: "Set up a new story and optionally link it to a story world or series" },
  { name: "create_character", description: "Create a new character and optionally link it to a story world or story" },
  { name: "create_location", description: "Create a new location and optionally link it to a story world or story" },
  { name: "create_faction", description: "Create a new faction and optionally link it to a story world or story" },
  { name: "create_object", description: "Create a new object (prop) and optionally link it to a story world or story" },
  { name: "create_relationship", description: "Create a relationship between two characters" },
  { name: "create_item", description: "Create a new item/artifact in the story world" },
  { name: "create_character_arc", description: "Create a character development arc for a story" },
  { name: "create_plotline", description: "Create a plotline for a story" },
  
  // Scene Management Tools
  { name: "import_scene", description: "Imports a new scene into the StoryVerse system" },
  { name: "import_text", description: "Imports and optionally parses a full text into multiple scenes" },
  { name: "create_scene_version", description: "Creates a new version of an existing scene" },
  { name: "get_scene_versions", description: "Retrieves version history for a scene" },
  { name: "restore_scene_version", description: "Restores a scene to a previous version" },
  { name: "compare_scene_versions", description: "Creates a detailed comparison between two scene versions" },
  { name: "add_scene_comment", description: "Adds a comment to a scene" },
  { name: "resolve_scene_comment", description: "Marks a comment as resolved or unresolved" },
  { name: "process_scene", description: "Processes a scene according to instructions, creating a new version" },
  { name: "address_scene_comments", description: "Creates a new scene version that addresses specified comments" },
  { name: "export_project", description: "Exports a complete project as a single document" },
  { name: "export_fountain", description: "Exports scenes in Fountain format, with proper screenplay formatting" },
  
  // Scene Tools
  { name: "split_scene", description: "Splits a scene into multiple scenes at specified positions" },
  { name: "combine_scenes", description: "Combines multiple scenes into a single scene" },
  { name: "scene_to_writing_sample", description: "Creates a writing sample from a scene's content" },
  { name: "detect_storylines", description: "Analyzes a story's content and structure to identify distinct storylines and plot arcs" },
  
  // Scene Metadata Tools
  { name: "update_scene_creation_notes", description: "Adds or updates creation notes for a scene with timestamps" },
  { name: "generate_character_5q", description: "Analyzes a scene and generates 5Q answers for each character" },
  { name: "update_character_5q", description: "Updates the 5Q answers for a specific character in a scene" },
  { name: "analyze_scene_subtext", description: "Analyzes a scene and suggests possible subtexts" },
  { name: "update_scene_subtext", description: "Updates the subtext notes for a scene" },
  
  // Import Tools
  { name: "import_analyzed_story", description: "Imports pre-analyzed story data (produced by Claude) into the database, handling entity relationships and deduplication" },
  
  // Object (Props) Tools
  { name: "link_object_to_character", description: "Establishes a relationship between an object and a character" },
  { name: "link_object_to_location", description: "Establishes a relationship between an object and a location" },
  { name: "track_object_appearance", description: "Records an appearance of an object in a scene or event" },
  { name: "analyze_object_usage", description: "Analyzes how objects are used throughout a story" }
];

// Path to the MCP server code in GitHub
export const MCP_SERVER_LOCATION = {
  repository: "https://github.com/electroglodyte/storyverse-client/tree/main/mcp-server",
  startCommand: "node index.js", 
  localPath: "/mcp-server/index.js"
};

// Edge Function locations
export const EDGE_FUNCTIONS = {
  styleProfileCreator: "style-profile-creator",
  webApi: "web-api",
  serveWeb: "serve-web",
  mcpServer: "mcp-server",
  importStory: "import-story"
};