// Version information for StoryVerse client
export const VERSION = '0.9.12';
export const VERSION_DATE = '2025-05-17';
export const VERSION_NOTES = `Additional fixes for Vercel deployment:
- Added proper ESLint configuration file
- Updated Vercel config with explicit legacy-peer-deps install command
- Synchronized version number across all config files

Previous (0.9.11): Fixed dependency conflicts for Vercel deployment:
- Updated React and TypeScript type definitions to resolve version conflicts
- Added .npmrc file with legacy-peer-deps=true for better compatibility
- Reset package-lock.json to allow Vercel to generate a fresh dependency tree
- Fixed TypeScript ESLint plugin dependencies to ensure build compatibility

Previous (0.9.10): Fixed dependency issues for Vercel deployment:
- Removed @types/react-dropzone as react-dropzone now includes its own TypeScript types
- This fixes the build error during npm install on Vercel

Previous (0.9.9): Fixed database and Supabase connectivity:
- Added database.types.ts with proper TypeScript definitions for Supabase tables
- Created proper exports for supabaseClient in lib directory 
- Fixed imports in entityImporter.ts
- Improved build process compatibility with Vercel deployment`;
