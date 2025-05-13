// /src/pages/SamplesPage.tsx
import React, { useState, useEffect } from 'react';
import { SampleList } from '../components/samples/SampleList';
import { supabase } from '../lib/supabase';

// Define types locally
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

interface SampleFilter {
  projectId?: string;
  sampleType?: string;
  author?: string;
  tags?: string[];
  searchQuery?: string;
}

export const SamplesPage: React.FC = () => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SampleFilter>({});

  // Simple data fetching
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        setLoading(true);
        
        const { data, error: fetchError } = await supabase
          .from('writing_samples')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (fetchError) throw fetchError;
        
        setSamples(data || []);
      } catch (err) {
        console.error('Error fetching samples:', err);
        setError('Failed to load samples');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSamples();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <SampleList 
        samples={samples}
        loading={loading}
        filter={filter}
        onFilterChange={setFilter}
      />
    </div>
  );
};