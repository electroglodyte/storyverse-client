// Version information for StoryVerse client
export const VERSION = '0.9.20';
export const VERSION_DATE = '2025-05-17';
export const VERSION_NOTES = `Improved JSON Import functionality:
- Added Supabase Edge Function for story import
- Implemented intelligent entity type detection
- Fixed issue with factions incorrectly identified as characters
- Added support for importing complex entity types like scenes and story questions
- Enhanced error handling and logging
- Improved JSON data type detection
- Added ability to import complete story data structures
- Preserved context (story and story world IDs) across imports

Previous (0.9.19): Added TypeScript verification and testing:
- Enhanced TypeScript configuration:
  * Enabled strict mode with all strict flags
  * Added strict null checks and function types
  * Configured path aliases and module resolution
  * Added comprehensive type declarations
- Implemented enhanced type definitions:
  * Added extended types for all entities
  * Added type guards for runtime checks
  * Added utility types for forms
  * Proper null handling in types
- Added test infrastructure:
  * Vitest configuration with React testing
  * Test coverage reporting
  * Mock implementations for dependencies
  * DOM testing environment
- Added database operation tests:
  * Character operation tests
  * Faction operation tests
  * Location operation tests
  * Error case handling
  * Null relationship handling`;
