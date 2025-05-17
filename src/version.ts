// Version information for StoryVerse client
export const VERSION = '0.9.17';
export const VERSION_DATE = '2025-05-17';
export const VERSION_NOTES = `Added Entity components and forms:
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
  * Loading states for all async operations

Previous (0.9.16): Added error handling and layout components:
- Added consistent error handling components:
  * ErrorBoundary for catching React errors
  * ErrorDisplay for user-friendly error messages
  * LoadingState for consistent loading indicators
- Implemented type-safe database operations:
  * Added database utility functions
  * Type-safe error handling
  * Validation utilities
- Added robust data fetching hooks:
  * useFetch for data retrieval
  * useMutation for data modifications
  * Proper loading and error states
- Created layout components:
  * BaseLayout with error boundaries
  * NavigationGuard for route protection
  * Consistent page structure
- Improved build process:
  * Added error boundaries to all routes
  * Implemented proper code splitting
  * Added loading states to async operations
- Enhanced type safety:
  * Strict null checks enabled
  * Proper error type definitions
  * Complete type coverage`;
