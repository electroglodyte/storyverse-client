export const version = {
  major: 0,
  minor: 9,
  patch: 48,
  date: '2025-05-15',
  notes: 'Fixed TypeScript error in ImportAndAnalyzeStory.tsx - changed story.name to story.title to match the Story interface definition. This was causing build failures in the deployment pipeline. Previous version (0.9.47): Implemented robust deduplication for all entity types in SupabaseService to prevent duplicate entries when saving extracted story elements.'
};
