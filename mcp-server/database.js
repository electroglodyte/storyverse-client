// database.js
import { createClient } from '@supabase/supabase-js';

// Supabase connection details from the StoryVerse Implementation Plan
const SUPABASE_URL = 'https://rkmjjhjjpnhjymqmcvpe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbWpqaGpqcG5oanltcW1jdnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MzM5NDUsImV4cCI6MjA2MjQwOTk0NX0.GlxA96751aHLq0Bi6nhKXtWHF0tlmWvsemGr3heQ13k';

// Initialize the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Export default for convenience
export default supabase;
