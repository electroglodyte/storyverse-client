import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

// Type definitions
interface WritingSample {
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
  story_id?: string;
}

// Component
const WritingSamplesPage: React.FC = () => {
  const [samples, setSamples] = useState<WritingSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [author, setAuthor] = useState<string>('');
  const [sampleType, setSampleType] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Fetch writing samples
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        setLoading(true);
        
        // Query the writing_samples table
        const { data, error: fetchError } = await supabase
          .from('writing_samples')
          .select('*')
          .order('updated_at', { ascending: false });
        
        if (fetchError) throw fetchError;
        
        setSamples(data || []);
      } catch (err) {
        console.error('Error fetching writing samples:', err);
        setError('Failed to load writing samples');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSamples();
  }, []);

  // Get unique authors and types for filters
  const authors = Array.from(new Set(samples.map(s => s.author).filter(Boolean)));
  const types = Array.from(new Set(samples.map(s => s.sample_type).filter(Boolean)));

  // Apply filters
  const filteredSamples = samples.filter(sample => {
    const matchesAuthor = !author || sample.author === author;
    const matchesType = !sampleType || sample.sample_type === sampleType;
    const matchesSearch = !searchTerm || 
      sample.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (sample.content && sample.content.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesAuthor && matchesType && matchesSearch;
  });

  // Reset filters
  const handleReset = () => {
    setAuthor('');
    setSampleType('');
    setSearchTerm('');
  };

  // Empty state component
  const EmptyState = () => (
    <div className="empty-state">
      <div className="icon">
        <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3>No writing samples yet</h3>
      <p>Add your first writing sample to get started</p>
      <Link to="/samples/new" className="button primary">
        <span className="icon-plus">+</span> Add Sample
      </Link>
    </div>
  );

  return (
    <div className="samples-page">
      <div className="page-header">
        <h1>Writing Samples</h1>
        <Link to="/samples/new" className="button primary">
          <span className="icon-plus">+</span> Add Sample
        </Link>
      </div>

      {/* Search and filters */}
      <div className="filters-panel">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search samples..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="author">Author</label>
            <select
              id="author"
              value={author}
              onChange={e => setAuthor(e.target.value)}
            >
              <option value="">All Authors</option>
              {authors.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              value={sampleType}
              onChange={e => setSampleType(e.target.value)}
            >
              <option value="">All Types</option>
              {types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleReset}
            className="button reset"
          >
            Reset
          </button>
        </div>
      </div>
      
      {/* View mode toggle */}
      <div className="view-toggle">
        <div className="toggle-buttons">
          <button
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'active' : ''}
            aria-label="Grid view"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 8a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zm6-6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zm0 8a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'active' : ''}
            aria-label="List view"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : filteredSamples.length === 0 ? (
        <EmptyState />
      ) : viewMode === 'grid' ? (
        <div className="samples-grid">
          {filteredSamples.map(sample => (
            <Link 
              key={sample.id}
              to={`/samples/${sample.id}`}
              className="sample-card"
            >
              <div className="sample-card-content">
                <h3>{sample.title}</h3>
                {sample.author && (
                  <p className="author">{sample.author}</p>
                )}
                <p className="excerpt">
                  {sample.excerpt || (sample.content && sample.content.substring(0, 150) + '...')}
                </p>
                <div className="card-footer">
                  <span className="word-count">{sample.word_count || 0} words</span>
                  <span className="date">{new Date(sample.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="samples-list">
          <ul>
            {filteredSamples.map((sample, index) => (
              <li key={sample.id}>
                <Link 
                  to={`/samples/${sample.id}`}
                  className="sample-list-item"
                >
                  <div className="sample-info">
                    <h3>{sample.title}</h3>
                    {sample.author && (
                      <p className="author">{sample.author}</p>
                    )}
                    <p className="excerpt">
                      {sample.excerpt || (sample.content && sample.content.substring(0, 100) + '...')}
                    </p>
                  </div>
                  <div className="sample-meta">
                    <span className="word-count">{sample.word_count || 0} words</span>
                    <span className="date">{new Date(sample.updated_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add styles for the components */}
      <style>{`
        /* General styles */
        .samples-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        h1 {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        
        /* Button styles */
        .button {
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: background-color 0.2s, transform 0.1s;
        }
        
        .button:active {
          transform: translateY(1px);
        }
        
        .primary {
          background-color: #8a6d4d;
          color: white;
          border: none;
        }
        
        .primary:hover {
          background-color: #654321;
        }
        
        .reset {
          background-color: transparent;
          border: 1px solid #c3b7a9;
          color: #654321;
        }
        
        .reset:hover {
          background-color: #f2eee6;
        }
        
        .icon-plus {
          margin-right: 4px;
        }
        
        /* Filters panel */
        .filters-panel {
          background-color: white;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          border: 1px solid #e8e1d9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .search-box {
          margin-bottom: 16px;
        }
        
        .search-box input {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #c3b7a9;
          font-size: 14px;
        }
        
        .filter-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .filter-group {
          flex: 1;
          min-width: 200px;
        }
        
        .filter-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #8a6d4d;
          margin-bottom: 4px;
        }
        
        .filter-group select {
          width: 100%;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #c3b7a9;
          background-color: white;
          font-size: 14px;
        }
        
        /* View toggle */
        .view-toggle {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 16px;
        }
        
        .toggle-buttons {
          display: flex;
          border: 1px solid #c3b7a9;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .toggle-buttons button {
          padding: 4px 12px;
          background-color: white;
          border: none;
          cursor: pointer;
          color: #8a6d4d;
          transition: background-color 0.2s;
        }
        
        .toggle-buttons button.active {
          background-color: #e8e1d9;
          color: #654321;
        }
        
        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 48px 16px;
          background-color: white;
          border-radius: 8px;
          border: 1px solid #e8e1d9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .empty-state .icon {
          display: inline-block;
          margin-bottom: 16px;
          color: #c3b7a9;
        }
        
        .empty-state h3 {
          font-size: 18px;
          font-weight: 500;
          color: #654321;
          margin-bottom: 8px;
        }
        
        .empty-state p {
          color: #8a6d4d;
          margin-bottom: 24px;
        }
        
        /* Error message */
        .error-message {
          background-color: #fee2e2;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 24px;
          border: 1px solid #fecaca;
        }
        
        .error-message p {
          color: #b91c1c;
          margin: 0;
        }
        
        /* Loading spinner */
        .loading-spinner {
          display: flex;
          justify-content: center;
          padding: 48px;
        }
        
        .spinner {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #8a6d4d;
          border-right-color: #8a6d4d;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Grid view */
        .samples-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }
        
        .sample-card {
          display: block;
          background-color: white;
          border-radius: 8px;
          border: 1px solid #e8e1d9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          text-decoration: none;
          transition: box-shadow 0.2s, transform 0.1s;
          overflow: hidden;
        }
        
        .sample-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .sample-card-content {
          padding: 16px;
        }
        
        .sample-card-content h3 {
          font-weight: 500;
          color: #654321;
          margin: 0 0 4px 0;
          font-size: 18px;
        }
        
        .sample-card-content .author {
          font-size: 14px;
          color: #ab8760;
          margin: 0 0 8px 0;
        }
        
        .sample-card-content .excerpt {
          font-size: 14px;
          color: #8a6d4d;
          margin: 0 0 12px 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }
        
        .card-footer {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #ab8760;
        }
        
        /* List view */
        .samples-list {
          background-color: white;
          border-radius: 8px;
          border: 1px solid #e8e1d9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        
        .samples-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .samples-list li {
          border-bottom: 1px solid #e8e1d9;
        }
        
        .samples-list li:last-child {
          border-bottom: none;
        }
        
        .sample-list-item {
          display: flex;
          justify-content: space-between;
          padding: 16px;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        
        .sample-list-item:hover {
          background-color: #f2eee6;
        }
        
        .sample-info {
          flex: 1;
        }
        
        .sample-info h3 {
          font-weight: 500;
          color: #654321;
          margin: 0 0 4px 0;
          font-size: 16px;
        }
        
        .sample-info .author {
          font-size: 14px;
          color: #ab8760;
          margin: 4px 0;
        }
        
        .sample-info .excerpt {
          font-size: 14px;
          color: #8a6d4d;
          margin: 8px 0 0 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }
        
        .sample-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-between;
          font-size: 12px;
          color: #ab8760;
          margin-left: 16px;
          min-width: 100px;
        }
        
        /* Responsive adjustments */
        @media (max-width: 640px) {
          .filter-controls {
            flex-direction: column;
          }
          
          .filter-group {
            width: 100%;
          }
          
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .sample-list-item {
            flex-direction: column;
          }
          
          .sample-meta {
            flex-direction: row;
            margin-left: 0;
            margin-top: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default WritingSamplesPage;