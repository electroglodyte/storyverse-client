// Version information for StoryVerse client
export const VERSION = '0.9.10';
export const VERSION_DATE = '2025-05-16';
export const VERSION_NOTES = `Fixed dependency issues for Vercel deployment:
- Removed @types/react-dropzone as react-dropzone now includes its own TypeScript types
- This fixes the build error during npm install on Vercel

Previous (0.9.9): Fixed database and Supabase connectivity:
- Added database.types.ts with proper TypeScript definitions for Supabase tables
- Created proper exports for supabaseClient in lib directory 
- Fixed imports in entityImporter.ts
- Improved build process compatibility with Vercel deployment

Previous (0.9.8): Added Generic Entity Importer:
- Created a flexible entity import system that works with multiple entity types (locations, factions, etc.)
- Added TypeScript interfaces for proper type safety and validation
- The importer handles both single entities and arrays
- Supports enhanced preprocessing of entities before database insertion
- Maintains backward compatibility with existing features
- Improved error handling and user feedback through the UI
- First implementation focusing on location imports, with framework ready for other entity types`;
