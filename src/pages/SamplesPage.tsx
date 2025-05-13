// /src/pages/SamplesPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useProject } from '../context/ProjectContext';

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

interface SamplesPageProps {}

export const SamplesPage: React.FC<SamplesPageProps> = () => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeProject } = useProject();

  // Filter state
  const [author, setAuthor] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get unique authors and types for filter
  const authors = Array.from(new Set(samples.map(s => s.author).filter(Boolean) as string[]));
  const types = Array.from(new Set(samples.map(s => s.sample_type).filter(Boolean) as string[]));

  // Simple data fetching
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        setLoading(true);
        
        let query = supabase.from('writing_samples').select('*');
        
        // Filter by project if active
        if (activeProject?.id) {
          query = query.eq('project_id', activeProject.id);
        }
        
        const { data, error: fetchError } = await query.order('updated_at', { ascending: false });
        
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
  }, [activeProject?.id]);

  // Apply filters
  const filteredSamples = samples.filter(sample => {
    if (author && sample.author !== author) return false;
    if (type && sample.sample_type !== type) return false;
    return true;
  });

  // Reset filters
  const handleReset = () => {
    setAuthor('');
    setType('');
  };

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="inline-block mb-4">
        <svg className="w-16 h-16 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-primary-700 mb-2">No writing samples yet</h3>
      <p className="text-gray-500 mb-6">Add your first writing sample to get started</p>
      <Link 
        to="/samples/new"
        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
      >
        <span className="mr-1">+</span> Add Sample
      </Link>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary-700">Writing Samples</h1>
        <Link 
          to="/samples/new"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <span className="mr-1">+</span> Add Sample
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 bg-primary-50 p-4 rounded-md">
        <div className="flex-1">
          <label htmlFor="author" className="block text-sm font-medium text-primary-600 mb-1">Author</label>
          <select
            id="author"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            className="w-full p-2 border border-primary-300 rounded-md bg-white"
          >
            <option value="">All Authors</option>
            {authors.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <label htmlFor="type" className="block text-sm font-medium text-primary-600 mb-1">Type</label>
          <select
            id="type"
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full p-2 border border-primary-300 rounded-md bg-white"
          >
            <option value="">All Types</option>
            {types.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-none self-end">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-primary-300 rounded-md bg-white text-primary-700 hover:bg-primary-50"
          >
            Reset
          </button>
        </div>
      </div>
      
      {/* View mode toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex border border-primary-300 rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 ${viewMode === 'grid' ? 'bg-primary-200 text-primary-700' : 'bg-white text-primary-600'}`}
            aria-label="Grid view"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zm6-6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 ${viewMode === 'list' ? 'bg-primary-200 text-primary-700' : 'bg-white text-primary-600'}`}
            aria-label="List view"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredSamples.length === 0 ? (
        <EmptyState />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSamples.map(sample => (
            <Link 
              key={sample.id}
              to={`/samples/${sample.id}`}
              className="block bg-white rounded-lg shadow-sm hover:shadow transition-shadow"
            >
              <div className="p-4">
                <h3 className="font-medium text-primary-700 mb-1">{sample.title}</h3>
                {sample.author && (
                  <p className="text-sm text-primary-500 mb-2">{sample.author}</p>
                )}
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                  {sample.excerpt || sample.content.substring(0, 150) + '...'}
                </p>
                <div className="flex justify-between text-xs text-primary-500">
                  <span>{sample.word_count} words</span>
                  <span>{new Date(sample.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <ul className="divide-y divide-primary-200">
            {filteredSamples.map(sample => (
              <li key={sample.id}>
                <Link 
                  to={`/samples/${sample.id}`}
                  className="block hover:bg-primary-50 p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-primary-700">{sample.title}</h3>
                      {sample.author && (
                        <p className="text-sm text-primary-500 mt-1">{sample.author}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {sample.excerpt || sample.content.substring(0, 100) + '...'}
                      </p>
                    </div>
                    <div className="text-xs text-primary-500 whitespace-nowrap">
                      {new Date(sample.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};