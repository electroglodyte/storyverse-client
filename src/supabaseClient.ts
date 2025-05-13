import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase-tables';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rkmjjhjjpnhjymqmcvpe.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbWpqaGpqcG5oanltcW1jdnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MzM5NDUsImV4cCI6MjA2MjQwOTk0NX0.GlxA96751aHLq0Bi6nhKXtWHF0tlmWvsemGr3heQ13k';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
