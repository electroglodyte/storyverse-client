// Version information for StoryVerse client
export const VERSION = '0.9.15';
export const VERSION_DATE = '2025-05-17';
export const VERSION_NOTES = `Added comprehensive style system:
- Created types and interfaces for style system:
  * StyleMetric for quantitative style measures
  * StyleSample for example text content
  * StyleProfile for complete style definitions
  * StyleGuidance for writing guidance
- Implemented visualization components:
  * StyleAnalysisVisualization using radar charts
  * StyleSampleManager for uploading and managing samples
  * StyleGuidanceDisplay for writing guidance
  * StyleProfileDetail for complete profile management
- Added style profile management pages:
  * List view of all style profiles
  * Individual profile view/edit page
  * New profile creation page
- Integrated with MCP analysis tools:
  * Text analysis for style metrics
  * Sample analysis and storage
  * Guidance generation
- Added data persistence with Supabase

Previous (0.9.14): Added comprehensive scene management functionality:
- Created Scene type definitions and database schema
- Implemented SceneTable component for list view of scenes
- Added Timeline component for visual scene management
- Created SceneDetail component with version history
- Added commenting system with resolution tracking
- Created new pages for scene management:
  * Story scenes page with list/timeline views
  * Individual scene view/edit page
  * New scene creation page
- Added proper routing for scene management
- Integrated with Supabase for data persistence

Previous (0.9.13): Fixed TypeScript issues with DataGrid components:
- Improved DataGrid component with generic type support
- Fixed typings for StoryTable, StoryWorldsTable, and SeriesTable components
- Updated event handlers with proper typing
- Fixed pagination model in DataGrid to support the latest MUI DataGrid version

Previous (0.9.12): Additional fixes for Vercel deployment:
- Added proper ESLint configuration file
- Updated Vercel config with explicit legacy-peer-deps install command
- Synchronized version number across all config files

Previous (0.9.11): Fixed dependency conflicts for Vercel deployment:
- Updated React and TypeScript type definitions to resolve version conflicts
- Added .npmrc file with legacy-peer-deps=true for better compatibility
- Reset package-lock.json to allow Vercel to generate a fresh dependency tree
- Fixed TypeScript ESLint plugin dependencies to ensure build compatibility`;