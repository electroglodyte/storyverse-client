// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from our document
const supabaseUrl = 'https://rkmjjhjjpnhjymqmcvpe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbWpqaGpqcG5oanltcW1jdnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MzM5NDUsImV4cCI6MjA2MjQwOTk0NX0.GlxA96751aHLq0Bi6nhKXtWHF0tlmWvsemGr3heQ13k';

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
export interface Sample {
  id: string;
  title: string;
  author?: string;
  type?: string;
  content: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  sample_id: string;
  results: any;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface StyleProfile {
  id: string;
  name: string;
  description?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

// Helper functions for data fetching
export async function fetchSamples(projectId?: string): Promise<Sample[]> {
  // If projectId is provided, filter by project
  let query = supabase.from('samples').select('*');
  
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching samples:', error);
    return [];
  }
  
  return data || [];
}

export async function fetchSample(id: string): Promise<Sample | null> {
  const { data, error } = await supabase
    .from('samples')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching sample:', error);
    return null;
  }
  
  return data;
}

export async function createSample(sample: Omit<Sample, 'id' | 'created_at' | 'updated_at'>): Promise<Sample | null> {
  const { data, error } = await supabase
    .from('samples')
    .insert([sample])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating sample:', error);
    return null;
  }
  
  return data;
}

export async function updateSample(id: string, updates: Partial<Sample>): Promise<Sample | null> {
  const { data, error } = await supabase
    .from('samples')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating sample:', error);
    return null;
  }
  
  return data;
}

export async function deleteSample(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('samples')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting sample:', error);
    return false;
  }
  
  return true;
}

// Project functions
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  
  return data || [];
}

export async function fetchProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }
  
  return data;
}