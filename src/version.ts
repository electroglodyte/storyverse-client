// Version information for StoryVerse client
export const VERSION = '0.8.2';
export const VERSION_DATE = '2025-05-16';
export const VERSION_NOTES = 'Fixed Promise handling in Importer.tsx. Properly awaiting all extractor function results and handling arrays safely. This fixes TypeScript build errors related to accessing properties like "length" and "map" on Promise objects.';
