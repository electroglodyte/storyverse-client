// Version information for StoryVerse client
export const VERSION = '0.9.19';
export const VERSION_DATE = '2025-05-17';
export const VERSION_NOTES = `Added TypeScript verification and testing:
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
  * Null relationship handling

Previous (0.9.18): Added comprehensive database queries and UI components:
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
  * Proper null handling for optional relationships`;
