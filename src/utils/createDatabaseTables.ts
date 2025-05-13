/**
 * Create Database Tables SQL Script for StoryVerse
 * 
 * This script creates all the necessary tables for the StoryVerse application.
 * We'll prepare this as a SQL string that can be executed via the Supabase client.
 */

// SQL script to create all needed tables
export const createDatabaseTablesSQL = `
-- Create story_worlds table
CREATE TABLE IF NOT EXISTS public.story_worlds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT
);

-- Create series table
CREATE TABLE IF NOT EXISTS public.series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  storyworld_id UUID REFERENCES public.story_worlds(id) ON DELETE CASCADE,
  story_world_id UUID REFERENCES public.story_worlds(id) ON DELETE CASCADE,
  sequence_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT
);

-- Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  name TEXT,
  description TEXT,
  storyworld_id UUID REFERENCES public.story_worlds(id) ON DELETE SET NULL,
  story_world_id UUID REFERENCES public.story_worlds(id) ON DELETE SET NULL,
  series_id UUID REFERENCES public.series(id) ON DELETE SET NULL,
  series_order INTEGER,
  status TEXT,
  word_count INTEGER DEFAULT 0,
  target_date TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  genre TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT
);

-- Create writing_samples table
CREATE TABLE IF NOT EXISTS public.writing_samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  author TEXT,
  sample_type TEXT,
  project_id TEXT,
  tags TEXT[],
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT
);

-- Create style_profiles table
CREATE TABLE IF NOT EXISTS public.style_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  genre TEXT[],
  project_id TEXT,
  comparable_authors TEXT[],
  user_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT
);

-- Create sample_analyses table
CREATE TABLE IF NOT EXISTS public.sample_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sample_id UUID REFERENCES public.writing_samples(id) ON DELETE CASCADE,
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profile_samples junction table
CREATE TABLE IF NOT EXISTS public.profile_samples (
  profile_id UUID REFERENCES public.style_profiles(id) ON DELETE CASCADE,
  sample_id UUID REFERENCES public.writing_samples(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (profile_id, sample_id)
);

-- Create representative_samples table
CREATE TABLE IF NOT EXISTS public.representative_samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.style_profiles(id) ON DELETE CASCADE,
  text_content TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable the uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
`;

export default createDatabaseTablesSQL;