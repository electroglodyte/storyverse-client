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
    <div style={{
      textAlign: 'center',
      padding: '3rem 1rem',
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      border: '1px solid #e8e1d9',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{ 
        display: 'inline-block',
        marginBottom: '1rem',
        color: '#c3b7a9'
      }}>
        <svg style={{ width: '4rem', height: '4rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 style={{ 
        fontSize: '1.125rem',
        fontWeight: '500',
        color: '#654321',
        marginBottom: '0.5rem'
      }}>
        No writing samples yet
      </h3>
      <p style={{ 
        color: '#8a6d4d',
        marginBottom: '1.5rem'
      }}>
        Add your first writing sample to get started
      </p>
      <Link 
        to="/samples/new"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.5rem 1rem',
          backgroundColor: '#8a6d4d',
          color: 'white',
          borderRadius: '0.375rem',
          textDecoration: 'none',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#654321' }}
        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#8a6d4d' }}
      >
        <span style={{ marginRight: '0.25rem' }}>+</span> Add Sample
      </Link>
    </div>
  );

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#654321'
        }}>
          Writing Samples
        </h1>
        <Link 
          to="/samples/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.5rem 1rem',
            backgroundColor: '#8a6d4d',
            color: 'white',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#654321' }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#8a6d4d' }}
        >
          <span style={{ marginRight: '0.25rem' }}>+</span> Add Sample
        </Link>
      </div>

      {/* Filters */}
      <div style={{
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: window.innerWidth < 640 ? 'column' : 'row',
        gap: '1rem',
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '0.5rem',
        border: '1px solid #e8e1d9',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ flex: '1' }}>
          <label 
            htmlFor="author" 
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#8a6d4d',
              marginBottom: '0.25rem'
            }}
          >
            Author
          </label>
          <select
            id="author"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #c3b7a9',
              borderRadius: '0.375rem',
              backgroundColor: 'white'
            }}
          >
            <option value="">All Authors</option>
            {authors.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        
        <div style={{ flex: '1' }}>
          <label 
            htmlFor="type"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#8a6d4d',
              marginBottom: '0.25rem'
            }}
          >
            Type
          </label>
          <select
            id="type"
            value={type}
            onChange={e => setType(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #c3b7a9',
              borderRadius: '0.375rem',
              backgroundColor: 'white'
            }}
          >
            <option value="">All Types</option>
            {types.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        
        <div style={{ 
          alignSelf: 'flex-end'
        }}>
          <button
            onClick={handleReset}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #c3b7a9',
              borderRadius: '0.375rem',
              backgroundColor: 'white',
              color: '#654321',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f2eee6' }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white' }}
          >
            Reset
          </button>
        </div>
      </div>
      
      {/* View mode toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          border: '1px solid #c3b7a9',
          borderRadius: '0.375rem',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: viewMode === 'grid' ? '#e8e1d9' : 'white',
              color: viewMode === 'grid' ? '#654321' : '#8a6d4d',
              cursor: 'pointer',
              border: 'none'
            }}
            aria-label="Grid view"
          >
            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zm6-6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: viewMode === 'list' ? '#e8e1d9' : 'white',
              color: viewMode === 'list' ? '#654321' : '#8a6d4d',
              cursor: 'pointer',
              border: 'none'
            }}
            aria-label="List view"
          >
            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          padding: '1rem',
          borderRadius: '0.375rem',
          marginBottom: '1.5rem',
          border: '1px solid #fecaca'
        }}>
          <p style={{ color: '#b91c1c' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '3rem'
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#8a6d4d transparent #8a6d4d transparent',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      ) : filteredSamples.length === 0 ? (
        <EmptyState />
      ) : viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredSamples.map(sample => (
            <Link 
              key={sample.id}
              to={`/samples/${sample.id}`}
              style={{
                display: 'block',
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                border: '1px solid #e8e1d9',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                textDecoration: 'none',
                transition: 'box-shadow 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)' }}
              onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <div style={{ padding: '1rem' }}>
                <h3 style={{ 
                  fontWeight: '500',
                  color: '#654321',
                  marginBottom: '0.25rem'
                }}>
                  {sample.title}
                </h3>
                {sample.author && (
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#ab8760',
                    marginBottom: '0.5rem'
                  }}>
                    {sample.author}
                  </p>
                )}
                <p style={{
                  fontSize: '0.875rem',
                  color: '#8a6d4d',
                  marginBottom: '0.75rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {sample.excerpt || sample.content.substring(0, 150) + '...'}
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: '#ab8760'
                }}>
                  <span>{sample.word_count} words</span>
                  <span>{new Date(sample.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          border: '1px solid #e8e1d9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filteredSamples.map((sample, index) => (
              <li key={sample.id} style={{
                borderBottom: index < filteredSamples.length - 1 ? '1px solid #e8e1d9' : 'none'
              }}>
                <Link 
                  to={`/samples/${sample.id}`}
                  style={{
                    display: 'block',
                    padding: '1rem',
                    textDecoration: 'none',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f2eee6' }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div>
                      <h3 style={{ 
                        fontWeight: '500',
                        color: '#654321'
                      }}>
                        {sample.title}
                      </h3>
                      {sample.author && (
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#ab8760',
                          marginTop: '0.25rem'
                        }}>
                          {sample.author}
                        </p>
                      )}
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#8a6d4d',
                        marginTop: '0.5rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {sample.excerpt || sample.content.substring(0, 100) + '...'}
                      </p>
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#ab8760',
                      whiteSpace: 'nowrap',
                      marginLeft: '1rem'
                    }}>
                      {new Date(sample.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add a style for the spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};