import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

// Type definitions
interface StyleProfile {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  style_parameters: any;
  dialogue_parameters?: any;
  example_passages?: string[];
  story_id?: string;
}

interface WritingSample {
  id: string;
  title: string;
  author?: string;
  sample_type?: string;
  word_count: number;
  content: string;
  excerpt?: string;
  weight: number;
}

interface Story {
  id: string;
  name: string;
}

interface RepresentativeSample {
  id: string;
  text_content: string;
  description?: string;
  created_at: string;
}

interface ProfileSample {
  weight: number;
  writing_samples: {
    id: string;
    title: string;
    author?: string;
    sample_type?: string;
    word_count: number;
    content: string;
    excerpt?: string;
  };
}

const ProfileDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State
  const [profile, setProfile] = useState<StyleProfile | null>(null);
  const [samples, setSamples] = useState<WritingSample[]>([]);
  const [representativeSamples, setRepresentativeSamples] = useState<RepresentativeSample[]>([]);
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'samples' | 'examples'>('overview');
  
  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch the style profile
        const { data: profileData, error: profileError } = await supabase
          .from('style_profiles')
          .select('*')
          .eq('id', id)
          .single();
        
        if (profileError) throw profileError;
        
        setProfile(profileData);
        
        // Fetch associated story if available
        if (profileData.story_id) {
          const { data: storyData, error: storyError } = await supabase
            .from('stories')
            .select('id, name')
            .eq('id', profileData.story_id)
            .single();
          
          if (!storyError) {
            setStory(storyData);
          }
        }
        
        // Fetch representative samples
        const { data: repSamples, error: repSamplesError } = await supabase
          .from('representative_samples')
          .select('*')
          .eq('profile_id', id)
          .order('created_at', { ascending: false });
        
        if (!repSamplesError) {
          setRepresentativeSamples(repSamples || []);
        }
        
        // Fetch writing samples associated with this profile
        const { data: profileSamplesData, error: samplesError } = await supabase
          .from('profile_samples')
          .select(`
            weight,
            writing_samples (
              id,
              title,
              author,
              sample_type,
              word_count,
              content,
              excerpt
            )
          `)
          .eq('profile_id', id);
        
        if (samplesError) throw samplesError;
        
        // Transform the data structure
        const formattedSamples: WritingSample[] = profileSamplesData?.map((item: ProfileSample) => ({
          id: item.writing_samples.id,
          title: item.writing_samples.title,
          author: item.writing_samples.author,
          sample_type: item.writing_samples.sample_type,
          word_count: item.writing_samples.word_count,
          content: item.writing_samples.content,
          excerpt: item.writing_samples.excerpt,
          weight: item.weight || 1.0
        })) || [];
        
        setSamples(formattedSamples);
        
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [id]);

  // Handle profile deletion
  const handleDelete = async () => {
    if (!profile || !window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Delete profile
      const { error: deleteError } = await supabase
        .from('style_profiles')
        .delete()
        .eq('id', profile.id);
      
      if (deleteError) throw deleteError;
      
      // Navigate back to profiles list
      navigate('/profiles');
      
    } catch (err) {
      console.error('Error deleting profile:', err);
      setError('Failed to delete profile');
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="profile-detail-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !profile) {
    return (
      <div className="profile-detail-page">
        <div className="error-message">
          <p>{error || 'Profile not found'}</p>
          <Link to="/profiles" className="button secondary">
            Back to Profiles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-detail-page">
      <div className="page-header">
        <div className="title-section">
          <h1>{profile.name}</h1>
          {story && <p className="story-name">From {story.name}</p>}
        </div>
        
        <div className="action-buttons">
          <Link to={`/writing-tool/${profile.id}`} className="button primary">
            Write in this Style
          </Link>
          <Link to={`/profiles/edit/${profile.id}`} className="button secondary">
            Edit
          </Link>
          <button onClick={handleDelete} className="button danger">
            Delete
          </button>
        </div>
      </div>

      {profile.description && (
        <div className="description-panel">
          <p>{profile.description}</p>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Style Overview
        </button>
        <button 
          className={`tab ${activeTab === 'samples' ? 'active' : ''}`}
          onClick={() => setActiveTab('samples')}
        >
          Source Samples ({samples.length})
        </button>
        <button 
          className={`tab ${activeTab === 'examples' ? 'active' : ''}`}
          onClick={() => setActiveTab('examples')}
        >
          Examples ({representativeSamples.length})
        </button>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="style-parameters">
              {/* Comparable authors section */}
              {profile.style_parameters?.comparable_authors && profile.style_parameters.comparable_authors.length > 0 && (
                <div className="parameter-section">
                  <h3>Comparable Authors</h3>
                  <div className="author-tags">
                    {profile.style_parameters.comparable_authors.map((author: string, index: number) => (
                      <span key={index} className="author-tag">{author}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Sentence structure section */}
              <div className="parameter-section">
                <h3>Sentence Structure</h3>
                <div className="parameters-grid">
                  <div className="parameter-card">
                    <div className="parameter-name">Preferred Length</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.sentence_length?.preferred || 'Moderate'}
                    </div>
                  </div>
                  <div className="parameter-card">
                    <div className="parameter-name">Complexity</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.sentence_complexity?.level || 'Moderate'}
                    </div>
                  </div>
                  <div className="parameter-card">
                    <div className="parameter-name">Variety</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.sentence_variety?.level || 'Moderate'}
                    </div>
                  </div>
                  <div className="parameter-card">
                    <div className="parameter-name">Punctuation Style</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.punctuation?.style || 'Standard'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Vocabulary section */}
              <div className="parameter-section">
                <h3>Vocabulary & Word Choice</h3>
                <div className="parameters-grid">
                  <div className="parameter-card">
                    <div className="parameter-name">Formality</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.vocabulary?.formality || 'Mixed'}
                    </div>
                  </div>
                  <div className="parameter-card">
                    <div className="parameter-name">Specificity</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.vocabulary?.specificity || 'Moderate'}
                    </div>
                  </div>
                  <div className="parameter-card">
                    <div className="parameter-name">Uncommon Words</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.vocabulary?.uncommon_frequency || 'Low'}
                    </div>
                  </div>
                  <div className="parameter-card">
                    <div className="parameter-name">Repetition</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.vocabulary?.repetition || 'Minimal'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Narrative style section */}
              <div className="parameter-section">
                <h3>Narrative Style</h3>
                <div className="parameters-grid">
                  <div className="parameter-card">
                    <div className="parameter-name">Point of View</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.narrative?.pov || 'Third person'}
                    </div>
                  </div>
                  <div className="parameter-card">
                    <div className="parameter-name">Tense</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.narrative?.tense || 'Past'}
                    </div>
                  </div>
                  <div className="parameter-card">
                    <div className="parameter-name">Show vs Tell</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.narrative?.showing_vs_telling || 'Balanced'}
                    </div>
                  </div>
                  <div className="parameter-card">
                    <div className="parameter-name">Description Level</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.narrative?.description_level || 'Moderate'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tone & Voice section */}
              <div className="parameter-section">
                <h3>Tone & Voice</h3>
                <div className="parameters-grid">
                  <div className="parameter-card">
                    <div className="parameter-name">Emotional Tone</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.tone?.emotional || 'Neutral'}
                    </div>
                  </div>
                  <div className="parameter-card">
                    <div className="parameter-name">Humor</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.tone?.humor || 'Minimal'}
                    </div>
                  </div>
                  <div className="parameter-card">
                    <div className="parameter-name">Lyricism</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.tone?.lyricism || 'Low'}
                    </div>
                  </div>
                  <div className="parameter-card">
                    <div className="parameter-name">Authorial Voice</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.tone?.authorial_presence || 'Moderate'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stylistic devices */}
              <div className="parameter-section">
                <h3>Stylistic Devices</h3>
                <div className="parameters-grid">
                  <div className="parameter-card">
                    <div className="parameter-name">Metaphors</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.devices?.metaphor_frequency || 'Occasional'}
                    </div>
                  </div>
                  <div className="parameter-card">
                    <div className="parameter-name">Similes</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.devices?.simile_frequency || 'Occasional'}
                    </div>
                  </div>
                  <div className="parameter-card">
                    <div className="parameter-name">Alliteration</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.devices?.alliteration_frequency || 'Low'}
                    </div>
                  </div>
                  <div className="parameter-card">
                    <div className="parameter-name">Personification</div>
                    <div className="parameter-value">
                      {profile.style_parameters?.devices?.personification || 'Minimal'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Dialogue parameters if available */}
              {profile.dialogue_parameters && (
                <div className="parameter-section">
                  <h3>Dialogue Style</h3>
                  <div className="parameters-grid">
                    <div className="parameter-card">
                      <div className="parameter-name">Frequency</div>
                      <div className="parameter-value">
                        {profile.dialogue_parameters?.frequency || 'Moderate'}
                      </div>
                    </div>
                    <div className="parameter-card">
                      <div className="parameter-name">Tags</div>
                      <div className="parameter-value">
                        {profile.dialogue_parameters?.tags_style || 'Standard'}
                      </div>
                    </div>
                    <div className="parameter-card">
                      <div className="parameter-name">Formatting</div>
                      <div className="parameter-value">
                        {profile.dialogue_parameters?.formatting || 'Quotations'}
                      </div>
                    </div>
                    <div className="parameter-card">
                      <div className="parameter-name">Length</div>
                      <div className="parameter-value">
                        {profile.dialogue_parameters?.length || 'Mixed'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'samples' && (
          <div className="samples-tab">
            {samples.length === 0 ? (
              <div className="no-samples">
                <p>This profile has no source samples.</p>
                <Link to={`/profiles/edit/${profile.id}`} className="button secondary">
                  Add Samples
                </Link>
              </div>
            ) : (
              <div className="samples-list">
                <div className="samples-header">
                  <h3>Writing Samples Used to Create This Profile</h3>
                  <Link to={`/profiles/edit/${profile.id}`} className="button secondary">
                    Manage Samples
                  </Link>
                </div>
                
                <table className="samples-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Type</th>
                      <th>Words</th>
                      <th>Weight</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {samples.map(sample => (
                      <tr key={sample.id}>
                        <td className="title-cell">{sample.title}</td>
                        <td>{sample.author || '-'}</td>
                        <td>{sample.sample_type || '-'}</td>
                        <td>{sample.word_count}</td>
                        <td>
                          <div className="weight-indicator">
                            <div 
                              className="weight-bar" 
                              style={{ width: `${Math.min(100, sample.weight * 50)}%` }}
                            />
                            <span className="weight-value">{sample.weight.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="actions-cell">
                          <Link to={`/samples/${sample.id}`} className="button icon">
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="examples-tab">
            <div className="examples-header">
              <h3>Representative Examples</h3>
              <Link to={`/profiles/edit/${profile.id}`} className="button secondary">
                Add Example
              </Link>
            </div>
            
            {representativeSamples.length === 0 ? (
              <div className="no-examples">
                <p>No representative examples have been added to this profile.</p>
                <p>Representative examples showcase the style at its best and can be used as reference for writers.</p>
              </div>
            ) : (
              <div className="examples-list">
                {representativeSamples.map(example => (
                  <div key={example.id} className="example-card">
                    <div className="example-content">
                      {example.text_content.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                    {example.description && (
                      <div className="example-description">
                        <h4>Notes:</h4>
                        <p>{example.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Pre-defined examples from profile if available */}
            {profile.example_passages && profile.example_passages.length > 0 && (
              <div className="predefined-examples">
                <h3>Pre-defined Example Passages</h3>
                <div className="examples-list">
                  {profile.example_passages.map((passage, index) => (
                    <div key={index} className="example-card">
                      <div className="example-content">
                        {passage.split('\n').map((paragraph, pIndex) => (
                          <p key={pIndex}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add styles for the components */}
      <style>{`
        /* General styles */
        .profile-detail-page {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .title-section h1 {
          font-size: 28px;
          font-weight: 600;
          color: #333;
          margin: 0 0 4px 0;
        }

        .title-section .story-name {
          font-size: 16px;
          color: #8a6d4d;
          margin: 0;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
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
          font-size: 14px;
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

        .secondary {
          background-color: white;
          border: 1px solid #c3b7a9;
          color: #654321;
        }

        .secondary:hover {
          background-color: #f2eee6;
        }

        .danger {
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }

        .danger:hover {
          background-color: #fca5a5;
        }

        .icon {
          padding: 6px;
        }

        /* Description panel */
        .description-panel {
          background-color: white;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          border: 1px solid #e8e1d9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .description-panel p {
          margin: 0;
          font-size: 16px;
          line-height: 1.6;
          color: #333;
        }

        /* Tabs */
        .tabs {
          display: flex;
          border-bottom: 1px solid #e8e1d9;
          margin-bottom: 24px;
        }

        .tab {
          padding: 12px 20px;
          border: none;
          background: none;
          font-size: 16px;
          font-weight: 500;
          color: #8a6d4d;
          cursor: pointer;
          position: relative;
        }

        .tab.active {
          color: #654321;
        }

        .tab.active:after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background-color: #8a6d4d;
        }

        /* Overview tab */
        .style-parameters {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .parameter-section {
          background-color: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #e8e1d9;
        }

        .parameter-section h3 {
          font-size: 18px;
          font-weight: 500;
          color: #654321;
          margin: 0 0 20px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #e8e1d9;
        }

        .parameters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .parameter-card {
          background-color: #f9f7f4;
          border-radius: 8px;
          padding: 12px;
        }

        .parameter-name {
          font-size: 14px;
          color: #8a6d4d;
          margin-bottom: 4px;
        }

        .parameter-value {
          font-size: 16px;
          font-weight: 500;
          color: #333;
        }

        .author-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .author-tag {
          background-color: #e8e1d9;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 14px;
          color: #654321;
        }

        /* Samples tab */
        .samples-header, .examples-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .samples-header h3, .examples-header h3 {
          font-size: 18px;
          font-weight: 500;
          color: #654321;
          margin: 0;
        }

        .samples-table {
          width: 100%;
          border-collapse: collapse;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .samples-table th, .samples-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e8e1d9;
        }

        .samples-table th {
          background-color: #f2eee6;
          font-weight: 500;
          color: #654321;
          font-size: 14px;
        }

        .samples-table tr:last-child td {
          border-bottom: none;
        }

        .title-cell {
          font-weight: 500;
          color: #333;
        }

        .weight-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .weight-bar {
          height: 8px;
          background-color: #8a6d4d;
          border-radius: 4px;
        }

        .weight-value {
          font-size: 14px;
          color: #666;
        }

        .actions-cell {
          text-align: right;
        }

        .no-samples, .no-examples {
          background-color: #f9f7f4;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          color: #8a6d4d;
        }

        .no-samples p, .no-examples p {
          margin: 0 0 16px 0;
        }

        /* Examples tab */
        .examples-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .example-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #e8e1d9;
          overflow: hidden;
        }

        .example-content {
          padding: 20px;
          font-size: 16px;
          line-height: 1.6;
          color: #333;
        }

        .example-content p {
          margin: 0 0 16px 0;
        }

        .example-content p:last-child {
          margin-bottom: 0;
        }

        .example-description {
          padding: 16px 20px;
          background-color: #f9f7f4;
          border-top: 1px solid #e8e1d9;
        }

        .example-description h4 {
          font-size: 14px;
          font-weight: 500;
          color: #654321;
          margin: 0 0 8px 0;
        }

        .example-description p {
          margin: 0;
          font-size: 14px;
          color: #666;
        }

        .predefined-examples {
          margin-top: 32px;
        }

        .predefined-examples h3 {
          font-size: 18px;
          font-weight: 500;
          color: #654321;
          margin: 0 0 20px 0;
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

        /* Error message */
        .error-message {
          background-color: #fee2e2;
          padding: 24px;
          border-radius: 8px;
          margin-bottom: 24px;
          border: 1px solid #fecaca;
          text-align: center;
        }

        .error-message p {
          color: #b91c1c;
          margin: 0 0 16px 0;
          font-size: 16px;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
          }
          
          .action-buttons {
            margin-top: 16px;
          }
          
          .parameters-grid {
            grid-template-columns: 1fr;
          }
          
          .tab {
            padding: 10px 12px;
            font-size: 14px;
          }
          
          .samples-table {
            display: block;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfileDetailPage;