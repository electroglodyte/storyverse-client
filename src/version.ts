export const version = {
  major: 0,
  minor: 9,
  patch: 49,
  date: '2025-05-15',
  notes: 'EMERGENCY FIX: Completely rewrote StoryAnalysisProgress component to bypass SupabaseService and directly access the database. This implementation uses direct database queries with explicit deduplication checks for each entity type. Previous version (0.9.48): Enhanced StoryAnalysisProgress with error handling and debugging.'
};
