// config.js (ES Module style)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rkmjjhjjpnhjymqmcvpe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbWpqaGpqcG5oanltcW1jdnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MzM5NDUsImV4cCI6MjA2MjQwOTk0NX0.GlxA96751aHLq0Bi6nhKXtWHF0tlmWvsemGr3heQ13k';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// If you have other config values, you can export them individually
export const otherConfig = 'value';

// If you need to do any initialization, you can do it here before exporting values