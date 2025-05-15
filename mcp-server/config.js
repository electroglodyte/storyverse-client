require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with explicit fallback values
const supabaseUrl = process.env.SUPABASE_URL || 'https://rkmjjhjjpnhjymqmcvpe.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbWpqaGpqcG5oanltcW1jdnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MzM5NDUsImV4cCI6MjA2MjQwOTk0NX0.GlxA96751aHLq0Bi6nhKXtWHF0tlmWvsemGr3heQ13k';

console.error("Using Supabase URL:", supabaseUrl);
console.error("Supabase key starts with:", supabaseKey.substring(0, 10) + "...");

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
