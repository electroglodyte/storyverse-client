// Version information for StoryVerse client
export const VERSION = '0.9.18';
export const VERSION_DATE = '2025-05-17';
export const VERSION_NOTES = `Added comprehensive database queries and UI components:
- Implemented proper table relationship queries:
  * Character queries with relationships, events, and arcs
  * Faction queries with members, leader, and headquarters
  * Location queries with parent/child relationships
- Added shadcn/ui components:
  * Button component with variants and sizes
  * Select component with full functionality
  * Proper styling utilities
- Enhanced data fetching:
  * Type-safe queries using Supabase client
  * Proper error handling
  * Relationship handling through join tables
  * Consistent ordering of related data
  * Proper null handling for optional relationships

Previous (0.9.17): Added Entity components and forms:
- Created type-safe entity detail components:
  * CharacterDetails with relationship and event tracking
  * LocationDetails with hierarchy management
  * FactionDetails with membership tracking
- Implemented shadcn/ui form components:
  * EntityForm base component with dynamic field generation
  * Character, Location, and Faction forms
  * Form validation using Zod
  * Proper TypeScript typing throughout
- Added comprehensive error handling:
  * Form validation with detailed error messages
  * API error handling with user-friendly displays
  * Loading states for all async operations`;
