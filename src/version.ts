// Version information for StoryVerse client
export const VERSION = '0.9.6';
export const VERSION_DATE = '2025-05-16';
export const VERSION_NOTES = 'Fixed JSON Import functionality by creating a new "import-story" Edge Function that properly handles the JSON data from Claude\'s story analysis. Updated the JSONImport component to use the correct Edge Function and parameter handling, resolving the "Failed to send a request to the Edge Function" error that was occurring during import attempts. Added the new Edge Function to the list in mcp-tools.ts to ensure proper registration within the application.';
