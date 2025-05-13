import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

// Type definitions
interface StyleProfile {
  id: string;
  name: string;
  description?: string;
  style_parameters: any;
  story_id?: string;
}

const StyleWritingToolPage: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  
  // State for the writing tool
  const [selectedProfile, setSelectedProfile] = useState<StyleProfile | null>(null);
  const [profiles, setProfiles] = useState<StyleProfile[]>([]);
  const [prompt, setPrompt] = useState('');
  const [styleStrength, setStyleStrength] = useState(1.0);
  const [length, setLength] = useState(500);
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch all available profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoadingProfiles(true);
        
        const { data, error } = await supabase
          .from('style_profiles')
          .select('id, name, description, style_parameters, story_id')
          .order('name');
        
        if (error) throw error;
        
        setProfiles(data || []);
        
        // Select the profile from URL parameter if available
        if (profileId && data) {
          const profile = data.find(p => p.id === profileId);
          if (profile) {
            setSelectedProfile(profile);
          }
        }
        
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setError('Failed to load style profiles');
      } finally {
        setLoadingProfiles(false);
      }
    };
    
    fetchProfiles();
  }, [profileId]);

  // Handle profile selection
  const handleProfileChange = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    setSelectedProfile(profile || null);
    
    // Update URL to reflect selected profile
    if (profile) {
      navigate(`/writing-tool/${profile.id}`, { replace: true });
    } else {
      navigate('/writing-tool', { replace: true });
    }
  };

  // Handle writing in style
  const handleWriteInStyle = async () => {
    if (!selectedProfile || !prompt.trim()) {
      setError('Please select a profile and enter a prompt');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call to the write_in_style MCP tool
      // In a real implementation, this would call the MCP tool
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock content
      const mockContent = `Once upon a time, in a village nestled between ancient mountains, there lived a young woman named Elena. Her cottage sat at the edge of a dense forest that few dared to enter after nightfall.

Elena was different from the other villagers. While they feared the unknown depths of the woods, she felt a strange pull toward them. On nights when the moon hung full and bright, she would sit by her window and watch shadows dance between the trees.

One particular evening, as autumn leaves carpeted the ground in rusty hues, Elena noticed something unusual. A soft blue light flickered deep among the trees, pulsing like a heartbeat. It wasn't the cool glow of moonlight or the warm flicker of a distant fire. This was something else entirely.

Without fully understanding why, Elena wrapped her woolen shawl around her shoulders and stepped outside. The night air carried the scent of pine and something sweeter—something foreign yet oddly familiar. Following her instincts, she walked toward the mysterious light.

The forest welcomed her with a symphony of subtle sounds: leaves rustling, branches creaking, distant creatures calling to one another. Yet there was an undercurrent of anticipation, as if the forest itself was holding its breath.`;
      
      setGeneratedContent(mockContent);
      
    } catch (err) {
      console.error('Error generating content:', err);
      setError('Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  // Handle saving generated content as a sample
  const handleSaveAsSample = () => {
    if (!generatedContent) return;
    
    // Navigate to new sample page with prefilled content
    navigate('/samples/new', { 
      state: { 
        content: generatedContent,
        title: prompt,
        sample_type: 'Generated Content',
        story_id: selectedProfile?.story_id
      } 
    });
  };

  return (
    <div className="writing-tool-page">
      <div className="page-header">
        <h1>Style Writing Tool</h1>
      </div>

      <div className="tool-container">
        <div className="tool-sidebar">
          <div className="sidebar-section">
            <h3>Select Style Profile</h3>
            {loadingProfiles ? (
              <div className="loading-indicator">Loading profiles...</div>
            ) : (
              <select
                value={selectedProfile?.id || ''}
                onChange={(e) => handleProfileChange(e.target.value)}
                className="profile-selector"
              >
                <option value="">Choose a profile</option>
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            )}
            
            {!selectedProfile && !loadingProfiles && (
              <div className="no-profile-message">
                <p>No profile selected.</p>
                <Link to="/profiles" className="text-link">
                  Manage profiles
                </Link>
                <span> or </span>
                <Link to="/profiles/new" className="text-link">
                  create a new one
                </Link>
              </div>
            )}
            
            {selectedProfile && (
              <div className="profile-details">
                <h4>{selectedProfile.name}</h4>
                {selectedProfile.description && (
                  <p className="description">{selectedProfile.description}</p>
                )}
              </div>
            )}
          </div>

          {selectedProfile && (
            <>
              <div className="sidebar-section">
                <h3>Parameters</h3>
                <div className="form-group">
                  <label htmlFor="length">Content Length:</label>
                  <div className="range-with-value">
                    <input
                      type="range"
                      id="length"
                      min="100"
                      max="2000"
                      step="100"
                      value={length}
                      onChange={(e) => setLength(parseInt(e.target.value))}
                    />
                    <span className="range-value">{length} words</span>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="style-strength">Style Strength:</label>
                  <div className="range-with-value">
                    <input
                      type="range"
                      id="style-strength"
                      min="0.1"
                      max="2"
                      step="0.1"
                      value={styleStrength}
                      onChange={(e) => setStyleStrength(parseFloat(e.target.value))}
                    />
                    <span className="range-value">{styleStrength.toFixed(1)}</span>
                  </div>
                  <div className="range-labels">
                    <span>Subtle</span>
                    <span>Strong</span>
                  </div>
                </div>
              </div>
              
              <div className="sidebar-section">
                <button
                  onClick={handleWriteInStyle}
                  className="button primary full-width"
                  disabled={loading || !prompt.trim()}
                >
                  {loading ? 'Generating...' : 'Generate Content'}
                </button>
                
                {error && (
                  <div className="error-message">
                    <p>{error}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="tool-main">
          <div className="prompt-section">
            <label htmlFor="prompt">Writing Prompt:</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt or topic for your content..."
              rows={4}
            />
          </div>
          
          <div className="output-section">
            <div className="output-header">
              <h3>Generated Content</h3>
              {generatedContent && (
                <button 
                  onClick={handleSaveAsSample}
                  className="button secondary"
                >
                  Save as Sample
                </button>
              )}
            </div>
            
            <div className={`output-content ${loading ? 'loading' : ''}`}>
              {loading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Generating content in selected style...</p>
                </div>
              ) : generatedContent ? (
                <div className="content-display">
                  {generatedContent.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <div className="no-content-message">
                  <p>Your generated content will appear here.</p>
                  <p>Select a style profile, enter a prompt, and click "Generate Content" to begin.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add styles for the components */}
      <style>{`
        /* General styles */
        .writing-tool-page {
          max-width: 1300px;
          margin: 0 auto;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }

        /* Tool layout */
        .tool-container {
          display: flex;
          gap: 24px;
          min-height: 600px;
        }

        .tool-sidebar {
          width: 300px;
          flex-shrink: 0;
        }

        .tool-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* Sidebar styles */
        .sidebar-section {
          background-color: white;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid #e8e1d9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .sidebar-section h3 {
          font-size: 16px;
          font-weight: 500;
          color: #654321;
          margin: 0 0 12px 0;
        }

        .profile-selector {
          width: 100%;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #c3b7a9;
          background-color: white;
          margin-bottom: 12px;
        }

        .no-profile-message {
          font-size: 14px;
          color: #8a6d4d;
          margin-top: 8px;
        }

        .text-link {
          color: #654321;
          text-decoration: underline;
        }

        .profile-details {
          margin-top: 16px;
        }

        .profile-details h4 {
          font-size: 16px;
          font-weight: 500;
          color: #333;
          margin: 0 0 8px 0;
        }

        .profile-details .description {
          font-size: 14px;
          color: #666;
          margin: 0;
          line-height: 1.5;
        }

        /* Form controls */
        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #654321;
          margin-bottom: 8px;
        }

        .range-with-value {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .range-with-value input[type="range"] {
          flex: 1;
        }

        .range-value {
          font-size: 14px;
          color: #666;
          min-width: 50px;
          text-align: right;
        }

        .range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #8a6d4d;
          margin-top: 4px;
        }

        /* Button styles */
        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: background-color 0.2s, transform 0.1s;
          font-size: 14px;
          border: none;
        }

        .button:active {
          transform: translateY(1px);
        }

        .primary {
          background-color: #8a6d4d;
          color: white;
        }

        .primary:hover {
          background-color: #654321;
        }

        .primary:disabled {
          background-color: #c3b7a9;
          cursor: not-allowed;
        }

        .secondary {
          background-color: white;
          border: 1px solid #8a6d4d;
          color: #8a6d4d;
        }

        .secondary:hover {
          background-color: #f2eee6;
        }

        .full-width {
          width: 100%;
        }

        /* Main content area */
        .prompt-section {
          background-color: white;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid #e8e1d9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .prompt-section label {
          display: block;
          font-size: 16px;
          font-weight: 500;
          color: #654321;
          margin-bottom: 8px;
        }

        .prompt-section textarea {
          width: 100%;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #c3b7a9;
          font-size: 16px;
          resize: vertical;
        }

        .output-section {
          background-color: white;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #e8e1d9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .output-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .output-header h3 {
          font-size: 16px;
          font-weight: 500;
          color: #654321;
          margin: 0;
        }

        .output-content {
          flex: 1;
          background-color: #f9f7f4;
          border-radius: 6px;
          padding: 16px;
          position: relative;
          overflow-y: auto;
        }

        .output-content.loading {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .content-display {
          font-size: 16px;
          line-height: 1.6;
          color: #333;
        }

        .content-display p {
          margin-bottom: 16px;
        }

        .no-content-message {
          text-align: center;
          color: #8a6d4d;
          padding: 24px;
        }

        .no-content-message p {
          margin: 8px 0;
        }

        /* Loading spinner */
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: #8a6d4d;
          border-right-color: #8a6d4d;
          animation: spin 1s linear infinite;
        }

        .loading-spinner p {
          color: #8a6d4d;
          font-size: 14px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-indicator {
          font-size: 14px;
          color: #8a6d4d;
          padding: 8px 0;
        }

        /* Error message */
        .error-message {
          background-color: #fee2e2;
          padding: 10px;
          border-radius: 6px;
          margin-top: 12px;
          border: 1px solid #fecaca;
        }

        .error-message p {
          color: #b91c1c;
          margin: 0;
          font-size: 14px;
        }

        /* Responsive adjustments */
        @media (max-width: 900px) {
          .tool-container {
            flex-direction: column;
          }
          
          .tool-sidebar {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default StyleWritingToolPage;