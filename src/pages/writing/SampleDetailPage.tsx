import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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

interface StyleAnalysis {
  id: string;
  sample_id: string;
  created_at: string;
  sentence_metrics: any;
  vocabulary_metrics: any;
  narrative_characteristics: any;
  stylistic_devices: any;
  tone_attributes: any;
  comparable_authors?: string[];
  descriptive_summary: string;
}

interface Profile {
  id: string;
  name: string;
  description?: string;
  weight?: number;
}

const SampleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [sample, setSample] = useState<WritingSample | null>(null);
  const [analysis, setAnalysis] = useState<StyleAnalysis | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'analysis' | 'profiles'>('content');
  
  // Fetch sample data
  useEffect(() => {
    const fetchSampleData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch the writing sample
        const { data: sampleData, error: sampleError } = await supabase
          .from('writing_samples')
          .select('*')
          .eq('id', id)
          .single();
        
        if (sampleError) throw sampleError;
        
        // Fetch associated style analysis if it exists
        const { data: analysisData, error: analysisError } = await supabase
          .from('style_analyses')
          .select('*')
          .eq('sample_id', id)
          .single();
        
        if (analysisError && analysisError.code !== 'PGRST116') {
          // PGRST116 is "not found", which is OK - just means no analysis yet
          throw analysisError;
        }
        
        // Fetch associated style profiles 
        const { data: profilesData, error: profilesError } = await supabase
          .from('profile_samples')
          .select(`
            profile_id,
            weight,
            style_profiles (
              id,
              name,
              description
            )
          `)
          .eq('sample_id', id);
        
        if (profilesError) throw profilesError;
        
        // Transform profiles data
        const formattedProfiles = profilesData?.map(item => ({
          id: item.style_profiles.id,
          name: item.style_profiles.name,
          description: item.style_profiles.description,
          weight: item.weight || 1.0
        })) || [];
        
        setSample(sampleData);
        setAnalysis(analysisData || null);
        setProfiles(formattedProfiles);
        
      } catch (err) {
        console.error('Error fetching sample data:', err);
        setError('Failed to load sample data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSampleData();
  }, [id]);

  // Handle sample analysis request
  const handleAnalyze = async () => {
    if (!sample) return;
    
    try {
      setAnalyzeLoading(true);
      
      // Call the analyze_writing_sample tool
      // This is just a placeholder - in the real implementation, we would call the MCP tool
      // For demonstration purposes, we'll simulate the analysis result
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create mock analysis result
      const mockAnalysis = {
        id: `analysis_${Date.now()}`,
        sample_id: sample.id,
        created_at: new Date().toISOString(),
        sentence_metrics: {
          average_length: 18.5,
          length_variation: 8.2,
          complex_sentences_ratio: 0.35,
          simple_sentences_ratio: 0.25,
          compound_sentences_ratio: 0.4
        },
        vocabulary_metrics: {
          unique_words_ratio: 0.68,
          uncommon_words_ratio: 0.22,
          avg_word_length: 5.3
        },
        narrative_characteristics: {
          pov: 'Third person limited',
          tense: 'Past',
          narrative_distance: 'Moderate',
          showing_vs_telling: 'Balanced with slight preference for showing'
        },
        stylistic_devices: {
          metaphor_frequency: 'Moderate',
          simile_frequency: 'Low',
          alliteration_frequency: 'Low',
          repetition_patterns: 'Occasional intentional repetition for emphasis'
        },
        tone_attributes: {
          formality: 'Mixed formal and conversational',
          emotional_valence: 'Predominantly neutral with emotional peaks',
          humor: 'Subtle, occasional',
          lyricism: 'Moderate'
        },
        comparable_authors: [
          'Ernest Hemingway',
          'John Steinbeck'
        ],
        descriptive_summary: `The writing exhibits a balanced style with moderately complex sentence structures and measured vocabulary. The author tends to favor clarity over excessive ornamentation, with judicious use of descriptive elements. The third-person limited perspective creates intimacy while maintaining narrative control. Stylistically, there are connections to American modernist prose in the tradition of Hemingway and Steinbeck, with straightforward progression and selective detail.`
      };
      
      // In a real implementation, we would save this to the database
      // For now, just set it in state
      setAnalysis(mockAnalysis as StyleAnalysis);
      setActiveTab('analysis');
      
    } catch (err) {
      console.error('Error analyzing sample:', err);
      setError('Failed to analyze sample');
    } finally {
      setAnalyzeLoading(false);
    }
  };

  // Handle delete sample
  const handleDelete = async () => {
    if (!sample || !window.confirm('Are you sure you want to delete this sample? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Delete the sample
      const { error: deleteError } = await supabase
        .from('writing_samples')
        .delete()
        .eq('id', sample.id);
      
      if (deleteError) throw deleteError;
      
      // Navigate back to samples list
      navigate('/samples');
      
    } catch (err) {
      console.error('Error deleting sample:', err);
      setError('Failed to delete sample');
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="sample-detail-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !sample) {
    return (
      <div className="sample-detail-page">
        <div className="error-message">
          <p>{error || 'Sample not found'}</p>
          <Link to="/samples" className="button secondary">
            Back to Samples
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sample-detail-page">
      <div className="page-header">
        <div className="title-section">
          <h1>{sample.title}</h1>
          {sample.author && <p className="author">by {sample.author}</p>}
        </div>
        
        <div className="action-buttons">
          <Link to={`/samples/edit/${sample.id}`} className="button secondary">
            Edit
          </Link>
          <button onClick={handleDelete} className="button danger">
            Delete
          </button>
        </div>
      </div>

      <div className="meta-panel">
        <div className="meta-item">
          <span className="meta-label">Words</span>
          <span className="meta-value">{sample.word_count}</span>
        </div>
        
        {sample.sample_type && (
          <div className="meta-item">
            <span className="meta-label">Type</span>
            <span className="meta-value">{sample.sample_type}</span>
          </div>
        )}
        
        <div className="meta-item">
          <span className="meta-label">Updated</span>
          <span className="meta-value">{new Date(sample.updated_at).toLocaleDateString()}</span>
        </div>
        
        {sample.tags && sample.tags.length > 0 && (
          <div className="tags">
            {sample.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Content
        </button>
        <button 
          className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Analysis {!analysis && '(None yet)'}
        </button>
        <button 
          className={`tab ${activeTab === 'profiles' ? 'active' : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          Profiles ({profiles.length})
        </button>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'content' && (
          <div className="content-tab">
            <div className="sample-content">
              {sample.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            
            {!analysis && (
              <div className="analyze-banner">
                <p>This sample hasn't been analyzed yet.</p>
                <button 
                  onClick={handleAnalyze} 
                  className="button primary"
                  disabled={analyzeLoading}
                >
                  {analyzeLoading ? 'Analyzing...' : 'Analyze Sample'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-tab">
            {!analysis ? (
              <div className="no-analysis">
                <div className="icon">
                  <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3>No Analysis Available</h3>
                <p>Analyze this sample to identify its stylistic patterns and characteristics.</p>
                <button 
                  onClick={handleAnalyze} 
                  className="button primary"
                  disabled={analyzeLoading}
                >
                  {analyzeLoading ? 'Analyzing...' : 'Analyze Sample'}
                </button>
              </div>
            ) : (
              <div className="analysis-content">
                <div className="analysis-section">
                  <h3>Style Summary</h3>
                  <p className="summary">{analysis.descriptive_summary}</p>
                  
                  {analysis.comparable_authors && analysis.comparable_authors.length > 0 && (
                    <div className="comparable-authors">
                      <h4>Similar to</h4>
                      <div className="author-tags">
                        {analysis.comparable_authors.map(author => (
                          <span key={author} className="author-tag">{author}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="metrics-grid">
                  <div className="metrics-card">
                    <h3>Sentence Structure</h3>
                    <ul className="metrics-list">
                      <li>
                        <span className="metric-name">Average Length</span>
                        <span className="metric-value">{analysis.sentence_metrics.average_length} words</span>
                      </li>
                      <li>
                        <span className="metric-name">Length Variation</span>
                        <span className="metric-value">±{analysis.sentence_metrics.length_variation} words</span>
                      </li>
                      <li>
                        <span className="metric-name">Complex Sentences</span>
                        <span className="metric-value">{Math.round(analysis.sentence_metrics.complex_sentences_ratio * 100)}%</span>
                      </li>
                      <li>
                        <span className="metric-name">Simple Sentences</span>
                        <span className="metric-value">{Math.round(analysis.sentence_metrics.simple_sentences_ratio * 100)}%</span>
                      </li>
                    </ul>
                  </div>

                  <div className="metrics-card">
                    <h3>Vocabulary</h3>
                    <ul className="metrics-list">
                      <li>
                        <span className="metric-name">Unique Words</span>
                        <span className="metric-value">{Math.round(analysis.vocabulary_metrics.unique_words_ratio * 100)}%</span>
                      </li>
                      <li>
                        <span className="metric-name">Uncommon Words</span>
                        <span className="metric-value">{Math.round(analysis.vocabulary_metrics.uncommon_words_ratio * 100)}%</span>
                      </li>
                      <li>
                        <span className="metric-name">Avg Word Length</span>
                        <span className="metric-value">{analysis.vocabulary_metrics.avg_word_length} letters</span>
                      </li>
                    </ul>
                  </div>

                  <div className="metrics-card">
                    <h3>Narrative Style</h3>
                    <ul className="metrics-list">
                      <li>
                        <span className="metric-name">Point of View</span>
                        <span className="metric-value">{analysis.narrative_characteristics.pov}</span>
                      </li>
                      <li>
                        <span className="metric-name">Tense</span>
                        <span className="metric-value">{analysis.narrative_characteristics.tense}</span>
                      </li>
                      <li>
                        <span className="metric-name">Narrative Distance</span>
                        <span className="metric-value">{analysis.narrative_characteristics.narrative_distance}</span>
                      </li>
                      <li>
                        <span className="metric-name">Show vs Tell</span>
                        <span className="metric-value">{analysis.narrative_characteristics.showing_vs_telling}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="metrics-card">
                    <h3>Stylistic Devices</h3>
                    <ul className="metrics-list">
                      <li>
                        <span className="metric-name">Metaphors</span>
                        <span className="metric-value">{analysis.stylistic_devices.metaphor_frequency}</span>
                      </li>
                      <li>
                        <span className="metric-name">Similes</span>
                        <span className="metric-value">{analysis.stylistic_devices.simile_frequency}</span>
                      </li>
                      <li>
                        <span className="metric-name">Alliteration</span>
                        <span className="metric-value">{analysis.stylistic_devices.alliteration_frequency}</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="analysis-section">
                  <h3>Tone Analysis</h3>
                  <ul className="tone-list">
                    <li>
                      <span className="tone-name">Formality</span>
                      <span className="tone-value">{analysis.tone_attributes.formality}</span>
                    </li>
                    <li>
                      <span className="tone-name">Emotional Tone</span>
                      <span className="tone-value">{analysis.tone_attributes.emotional_valence}</span>
                    </li>
                    <li>
                      <span className="tone-name">Humor</span>
                      <span className="tone-value">{analysis.tone_attributes.humor}</span>
                    </li>
                    <li>
                      <span className="tone-name">Lyricism</span>
                      <span className="tone-value">{analysis.tone_attributes.lyricism}</span>
                    </li>
                  </ul>
                </div>

                <div className="analysis-actions">
                  <button onClick={handleAnalyze} className="button secondary">
                    Re-Analyze Sample
                  </button>
                  <Link to={`/profiles/new?sample=${sample.id}`} className="button primary">
                    Create Style Profile
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profiles' && (
          <div className="profiles-tab">
            {profiles.length === 0 ? (
              <div className="no-profiles">
                <div className="icon">
                  <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3>No Style Profiles Yet</h3>
                <p>This sample isn't used in any style profiles yet.</p>
                <Link to={`/profiles/new?sample=${sample.id}`} className="button primary">
                  Create New Profile
                </Link>
              </div>
            ) : (
              <div className="profiles-list">
                <div className="profiles-header">
                  <h3>Style Profiles Using This Sample</h3>
                  <Link to={`/profiles/new?sample=${sample.id}`} className="button primary">
                    Create New Profile
                  </Link>
                </div>
                
                <div className="profile-cards">
                  {profiles.map(profile => (
                    <Link key={profile.id} to={`/profiles/${profile.id}`} className="profile-card">
                      <h4>{profile.name}</h4>
                      {profile.description && (
                        <p className="description">{profile.description.substring(0, 120)}...</p>
                      )}
                      <div className="profile-meta">
                        <span className="weight">
                          Sample Weight: {profile.weight?.toFixed(1) || '1.0'}
                        </span>
                      </div>
                    </Link>
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
        .sample-detail-page {
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

        .title-section .author {
          font-size: 16px;
          color: #666;
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

        /* Meta panel */
        .meta-panel {
          display: flex;
          flex-wrap: wrap;
          background-color: #f2eee6;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 24px;
          gap: 24px;
          align-items: center;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
        }

        .meta-label {
          font-size: 12px;
          color: #8a6d4d;
          margin-bottom: 2px;
        }

        .meta-value {
          font-size: 16px;
          font-weight: 500;
          color: #654321;
        }

        .tags {
          display: flex;
          gap: 8px;
          margin-left: auto;
        }

        .tag {
          background-color: #e8e1d9;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 12px;
          color: #654321;
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

        /* Content tab */
        .content-tab {
          background-color: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .sample-content {
          font-size: 16px;
          line-height: 1.6;
          color: #333;
        }

        .sample-content p {
          margin-bottom: 16px;
        }

        .analyze-banner {
          margin-top: 32px;
          padding: 16px;
          border-radius: 8px;
          background-color: #f2eee6;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .analyze-banner p {
          margin: 0;
          color: #654321;
        }

        /* Analysis tab */
        .no-analysis, .no-profiles {
          text-align: center;
          padding: 64px 24px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .icon {
          display: inline-block;
          margin-bottom: 16px;
          color: #c3b7a9;
        }

        .no-analysis h3, .no-profiles h3 {
          font-size: 20px;
          font-weight: 500;
          color: #654321;
          margin-bottom: 8px;
        }

        .no-analysis p, .no-profiles p {
          color: #8a6d4d;
          margin-bottom: 24px;
        }

        .analysis-content {
          background-color: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .analysis-section {
          margin-bottom: 32px;
        }

        .analysis-section h3 {
          font-size: 20px;
          font-weight: 500;
          color: #654321;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e8e1d9;
        }

        .summary {
          font-size: 16px;
          line-height: 1.6;
          color: #333;
        }

        .comparable-authors {
          margin-top: 16px;
        }

        .comparable-authors h4 {
          font-size: 16px;
          font-weight: 500;
          color: #654321;
          margin-bottom: 8px;
        }

        .author-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .author-tag {
          background-color: #e8e1d9;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 14px;
          color: #654321;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .metrics-card {
          background-color: #f9f7f4;
          border-radius: 8px;
          padding: 16px;
        }

        .metrics-card h3 {
          font-size: 18px;
          font-weight: 500;
          color: #654321;
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid #e8e1d9;
        }

        .metrics-list, .tone-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .metrics-list li, .tone-list li {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .metric-name, .tone-name {
          color: #666;
        }

        .metric-value, .tone-value {
          font-weight: 500;
          color: #333;
        }

        .tone-list li {
          padding: 8px 0;
          border-bottom: 1px solid #e8e1d9;
        }

        .tone-list li:last-child {
          border-bottom: none;
        }

        .analysis-actions {
          display: flex;
          gap: 16px;
          margin-top: 32px;
        }

        /* Profiles tab */
        .profiles-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .profiles-header h3 {
          font-size: 20px;
          font-weight: 500;
          color: #654321;
          margin: 0;
        }

        .profile-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .profile-card {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #e8e1d9;
          text-decoration: none;
          transition: box-shadow 0.2s, transform 0.1s;
        }

        .profile-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .profile-card h4 {
          font-size: 18px;
          font-weight: 500;
          color: #654321;
          margin: 0 0 12px 0;
        }

        .profile-card .description {
          font-size: 14px;
          color: #666;
          margin: 0 0 16px 0;
          line-height: 1.5;
        }

        .profile-meta {
          display: flex;
          justify-content: flex-end;
          font-size: 14px;
          color: #8a6d4d;
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
          
          .meta-panel {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
          
          .tags {
            margin-left: 0;
          }
          
          .metrics-grid {
            grid-template-columns: 1fr;
          }
          
          .profile-cards {
            grid-template-columns: 1fr;
          }
          
          .analyze-banner {
            flex-direction: column;
            gap: 16px;
          }
          
          .analysis-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default SampleDetailPage;