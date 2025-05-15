export const version = {
  major: 0,
  minor: 9,
  patch: 47,
  date: '2025-05-15',
  notes: 'Implemented robust deduplication for all entity types in SupabaseService to prevent duplicate entries when saving extracted story elements. This fixes issues where characters and locations were being duplicated when analyzing stories. Previous version (0.9.46): Removed the "suspicious default values" check as it was only needed for debugging.'
};
