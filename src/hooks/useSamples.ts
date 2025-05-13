// /src/hooks/useSamples.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Define types locally to avoid import issues
interface Sample {
  id: string;
  title: string;
  content: string;
  author?: string;
  created_at: string;
  updated_at: string;
  sample_type?: string;
  tags?: string[];
  word_count: number;
  excerpt?: string;
  project_id: string;
}

interface NewSample {
  title: string;
  content: string;
  author?: string;
  sample_type?: string;
  tags?: string[];
  project_id: string;
}

interface SampleFilter {
  projectId?: string;
  sampleType?: string;
  author?: string;
  tags?: string[];
  searchQuery?: string;
}

export const useSamples = (initialFilter?: SampleFilter) => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SampleFilter>(initialFilter || {});

  const fetchSamples = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('writing_samples')
        .select('*');
      
      // Apply filters
      if (filter.projectId) {
        query = query.eq('project_id', filter.projectId);
      }
      
      if (filter.sampleType) {
        query = query.eq('sample_type', filter.sampleType);
      }
      
      if (filter.author) {
        query = query.eq('author', filter.author);
      }
      
      if (filter.tags && filter.tags.length > 0) {
        query = query.overlaps('tags', filter.tags);
      }
      
      if (filter.searchQuery) {
        query = query.or(`title.ilike.%${filter.searchQuery}%,content.ilike.%${filter.searchQuery}%`);
      }
      
      const { data, error } = await query.order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      setSamples(data as Sample[]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error fetching samples:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSample = async (id: string): Promise<Sample | null> => {
    try {
      const { data, error } = await supabase
        .from('writing_samples')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data as Sample;
    } catch (error) {
      console.error('Error fetching sample:', error);
      return null;
    }
  };

  const createSample = async (sample: NewSample): Promise<Sample | null> => {
    try {
      const excerpt = sample.content.slice(0, 200) + (sample.content.length > 200 ? '...' : '');
      
      const { data, error } = await supabase
        .from('writing_samples')
        .insert({
          ...sample,
          excerpt
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      setSamples(prevSamples => [data as Sample, ...prevSamples]);
      
      return data as Sample;
    } catch (error) {
      console.error('Error creating sample:', error);
      return null;
    }
  };

  const updateSample = async (id: string, updates: Partial<Sample>): Promise<Sample | null> => {
    try {
      // If content is updated, regenerate excerpt
      const updatedData: Partial<Sample> = { ...updates };
      if (updates.content) {
        updatedData.excerpt = updates.content.slice(0, 200) + (updates.content.length > 200 ? '...' : '');
      }
      
      const { data, error } = await supabase
        .from('writing_samples')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update local state
      setSamples(prevSamples => 
        prevSamples.map(sample => sample.id === id ? { ...sample, ...data } as Sample : sample)
      );
      
      return data as Sample;
    } catch (error) {
      console.error('Error updating sample:', error);
      return null;
    }
  };

  const deleteSample = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('writing_samples')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setSamples(prevSamples => prevSamples.filter(sample => sample.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting sample:', error);
      return false;
    }
  };

  const updateFilter = (newFilter: SampleFilter) => {
    setFilter(newFilter);
  };

  useEffect(() => {
    fetchSamples();
  }, [filter]);

  return {
    samples,
    loading,
    error,
    filter,
    updateFilter,
    getSample,
    createSample,
    updateSample,
    deleteSample,
    fetchSamples
  };
};