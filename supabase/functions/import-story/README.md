# Import Story Supabase Edge Function

This Edge Function handles importing complex story data into the StoryVerse database. It uses intelligent entity type detection to route different types of narrative elements to their proper database tables.

## Features

- Automatic entity type detection based on unique fields/properties
- Support for importing individual entity arrays (characters, locations, etc.)
- Support for importing complete story data with multiple entity collections
- Context preservation (story_id and story_world_id) across entities
- Deduplication to avoid creating duplicates
- Detailed logging and statistics for monitoring import progress

## Entity Types Supported

- Story Worlds
- Stories
- Characters
- Locations
- Factions
- Objects/Items
- Events
- Plotlines
- Scenes
- Story Questions
- Character Relationships
- Event Dependencies

## Usage

For client-side code, use the provided `entityImporter.ts` file with:

```typescript
import { importStoryData, importEntities, detectEntityType } from '../lib/entityImporter';

// Import a complete story dataset
const result = await importStoryData({
  storyWorld: { /* ... */ },
  story: { /* ... */ },
  characters: [ /* ... */ ],
  locations: [ /* ... */ ],
  // etc.
});

// Or import specific entity arrays with context
const result = await importEntities(characterArray, storyId, storyWorldId);
```

## Deployment

Deploy this function to your Supabase project using:

```bash
supabase functions deploy import-story
```

Make sure your Supabase project has the appropriate database tables and permissions set up to accept these entities.
