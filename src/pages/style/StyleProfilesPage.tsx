import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

// Type definitions
interface StyleProfile {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  style_parameters: any;
  story_id?: string;
  sample_count?: number;
  comparable_authors?: string[];
}

interface Story {
  id: string;
  name: string;
}

const StyleProfilesPage: React.FC = () => {
  const [profiles, setProfiles] = useState<StyleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<Record<string, Story>>({});
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [storyFilter, setStoryFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch style profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        
        // Fetch all profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('style_profiles')
          .select(`
            *,
            profile_samples!inner (
              id
            )
          `)
          .order('updated_at', { ascending: false });
        
        if (profilesError) throw profilesError;
        
        // Count the number of samples for each profile
        const profilesWithCounts = profilesData?.map(profile => {
          // Count the number of profile_samples entries for this profile
          const sampleCount = profile.profile_samples ? profile.profile_samples.length : 0;
          
          // Extract comparable authors from style_parameters if available
          let comparableAuthors: string[] = [];
          if (profile.style_parameters && profile.style_parameters.comparable_authors) {
            comparableAuthors = profile.style_parameters.comparable_authors;
          }
          
          return {
            ...profile,
            sample_count: sampleCount,
            comparable_authors: comparableAuthors,
            profile_samples: undefined // Remove the raw data as we've extracted what we need
          };
        }) || [];
        
        setProfiles(profilesWithCounts);
        
        // Fetch stories for all profiles that have a story_id
        const storyIds = profilesWithCounts
          .map(profile => profile.story_id)
          .filter(id => !!id) as string[];
        
        if (storyIds.length > 0) {
          const { data: storiesData, error: storiesError } = await supabase
            .from('stories')
            .select('id, name')
            .in('id', storyIds);
          
          if (storiesError) throw storiesError;
          
          // Convert to a lookup object for easy access
          const storiesMap = (storiesData || []).reduce((acc, story) => {
            acc[story.id] = story;
            return acc;
          }, {} as Record<string, Story>);
          
          setStories(storiesMap);
        }
        
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setError('Failed to load style profiles');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfiles();
  }, []);

  // Apply filters
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = !searchTerm || 
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (profile.description && profile.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStory = !storyFilter || profile.story_id === storyFilter;
    
    return matchesSearch && matchesStory;
  });

  // Get unique stories for filter
  const uniqueStories = Array.from(
    new Set(profiles.filter(p => p.story_id).map(p => p.story_id))
  ) as string[];

  // Reset filters
  const handleReset = () => {
    setSearchTerm('');
    setStoryFilter('');
  };

  // Empty state component
  const EmptyState = () => (
    <div className="empty-state">
      <div className="icon">
        <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3>No style profiles yet</h3>
      <p>Create your first style profile based on writing samples</p>
      <Link to="/profiles/new" className="button primary">
        <span className="icon-plus">+</span> Create Profile
      </Link>
    </div>
  );

  return (
    <div className="profiles-page">
      <div className="page-header">
        <h1>Style Profiles</h1>
        <Link to="/profiles/new" className="button primary">
          <span className="icon-plus">+</span> Create Profile
        </Link>
      </div>

      {/* Search and filters */}
      <div className="filters-panel">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search profiles..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="story">Story</label>
            <select
              id="story"
              value={storyFilter}
              onChange={e => setStoryFilter(e.target.value)}
            >
              <option value="">All Stories</option>
              {uniqueStories.map(storyId => (
                <option key={storyId} value={storyId}>
                  {stories[storyId]?.name || 'Unknown Story'}
                </option>
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
      ) : filteredProfiles.length === 0 ? (
        <EmptyState />
      ) : viewMode === 'grid' ? (
        <div className="profiles-grid">
          {filteredProfiles.map(profile => (
            <Link 
              key={profile.id}
              to={`/profiles/${profile.id}`}
              className="profile-card"
            >
              <div className="profile-card-content">
                <h3>{profile.name}</h3>
                {profile.description && (
                  <p className="description">
                    {profile.description.length > 120 
                      ? profile.description.substring(0, 120) + '...' 
                      : profile.description}
                  </p>
                )}
                
                {profile.comparable_authors && profile.comparable_authors.length > 0 && (
                  <div className="comparable-authors">
                    <span className="meta-label">Similar to:</span>
                    <div className="author-tags">
                      {profile.comparable_authors.map((author, index) => (
                        <span key={index} className="author-tag">
                          {author}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="card-footer">
                  <span className="sample-count">{profile.sample_count || 0} samples</span>
                  <span className="date">{new Date(profile.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="profiles-list">
          <ul>
            {filteredProfiles.map((profile, index) => (
              <li key={profile.id}>
                <Link 
                  to={`/profiles/${profile.id}`}
                  className="profile-list-item"
                >
                  <div className="profile-info">
                    <h3>{profile.name}</h3>
                    {profile.story_id && stories[profile.story_id] && (
                      <p className="story-name">{stories[profile.story_id].name}</p>
                    )}
                    {profile.description && (
                      <p className="description">
                        {profile.description.length > 160 
                          ? profile.description.substring(0, 160) + '...' 
                          : profile.description}
                      </p>
                    )}
                    
                    {profile.comparable_authors && profile.comparable_authors.length > 0 && (
                      <div className="author-tags">
                        {profile.comparable_authors.map((author, index) => (
                          <span key={index} className="author-tag">
                            {author}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="profile-meta">
                    <span className="sample-count">{profile.sample_count || 0} samples</span>
                    <span className="date">{new Date(profile.updated_at).toLocaleDateString()}</span>
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
        .profiles-page {
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
          align-items: flex-end;
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
        .profiles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }
        
        .profile-card {
          display: block;
          background-color: white;
          border-radius: 8px;
          border: 1px solid #e8e1d9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          text-decoration: none;
          transition: box-shadow 0.2s, transform 0.1s;
          overflow: hidden;
        }
        
        .profile-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .profile-card-content {
          padding: 16px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .profile-card-content h3 {
          font-weight: 500;
          color: #654321;
          margin: 0 0 12px 0;
          font-size: 18px;
        }
        
        .profile-card-content .description {
          font-size: 14px;
          color: #666;
          margin: 0 0 16px 0;
          line-height: 1.5;
          flex-grow: 1;
        }
        
        .comparable-authors {
          margin-bottom: 16px;
        }
        
        .meta-label {
          font-size: 12px;
          color: #8a6d4d;
          margin-bottom: 4px;
          display: block;
        }
        
        .author-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .author-tag {
          background-color: #f2eee6;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          color: #654321;
          white-space: nowrap;
        }
        
        .card-footer {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #8a6d4d;
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid #f2eee6;
        }
        
        /* List view */
        .profiles-list {
          background-color: white;
          border-radius: 8px;
          border: 1px solid #e8e1d9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        
        .profiles-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .profiles-list li {
          border-bottom: 1px solid #e8e1d9;
        }
        
        .profiles-list li:last-child {
          border-bottom: none;
        }
        
        .profile-list-item {
          display: flex;
          justify-content: space-between;
          padding: 16px;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        
        .profile-list-item:hover {
          background-color: #f2eee6;
        }
        
        .profile-info {
          flex: 1;
        }
        
        .profile-info h3 {
          font-weight: 500;
          color: #654321;
          margin: 0 0 4px 0;
          font-size: 16px;
        }
        
        .profile-info .story-name {
          font-size: 14px;
          color: #8a6d4d;
          margin: 0 0 8px 0;
        }
        
        .profile-info .description {
          font-size: 14px;
          color: #666;
          margin: 0 0 12px 0;
          line-height: 1.5;
        }
        
        .profile-info .author-tags {
          margin-top: 12px;
        }
        
        .profile-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          font-size: 12px;
          color: #8a6d4d;
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
          
          .profile-list-item {
            flex-direction: column;
          }
          
          .profile-meta {
            flex-direction: row;
            justify-content: space-between;
            margin-left: 0;
            margin-top: 12px;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default StyleProfilesPage;