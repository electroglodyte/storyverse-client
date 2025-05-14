import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

// Type definitions
interface StyleProfile {
  id: string;
  name: string;
  description?: string;
  style_parameters: any;
  dialogue_parameters?: any;
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
  weight?: number;
  isSelected?: boolean;
}

interface Story {
  id: string;
  name: string;
}

interface RepresentativeSample {
  text_content: string;
  description?: string;
}

const CreateProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!id;
  const queryParams = new URLSearchParams(location.search);
  const initialSampleId = queryParams.get('sample');
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [storyId, setStoryId] = useState<string | undefined>(undefined);
  const [comparableAuthors, setComparableAuthors] = useState('');
  const [samples, setSamples] = useState<WritingSample[]>([]);
  const [availableSamples, setAvailableSamples] = useState<WritingSample[]>([]);
  const [selectedSampleIds, setSelectedSampleIds] = useState<Set<string>>(new Set());
  const [sampleWeights, setSampleWeights] = useState<Record<string, number>>({});
  const [representativeSamples, setRepresentativeSamples] = useState<RepresentativeSample[]>([]);
  const [newExampleContent, setNewExampleContent] = useState('');
  const [newExampleDescription, setNewExampleDescription] = useState('');
  
  // Other state
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [activeTab, setActiveTab] = useState<'samples' | 'examples'>('samples');
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingInitial(true);
        
        // Fetch all stories
        const { data: storiesData, error: storiesError } = await supabase
          .from('stories')
          .select('id, name')
          .order('name');
        
        if (storiesError) throw storiesError;
        
        setStories(storiesData || []);
        
        // Fetch all available writing samples
        const { data: samplesData, error: samplesError } = await supabase
          .from('writing_samples')
          .select('*')
          .order('title');
        
        if (samplesError) throw samplesError;
        
        const formattedSamples = samplesData?.map(sample => ({
          ...sample,
          isSelected: sample.id === initialSampleId
        })) || [];
        
        setAvailableSamples(formattedSamples);
        
        // If initialSampleId is provided, add it to selected samples
        if (initialSampleId) {
          setSelectedSampleIds(new Set([initialSampleId]));
          setSampleWeights({
            [initialSampleId]: 1.0
          });
        }
        
        // If in edit mode, fetch the profile data
        if (isEditMode && id) {
          const { data: profileData, error: profileError } = await supabase
            .from('style_profiles')
            .select('*')
            .eq('id', id)
            .single();
          
          if (profileError) throw profileError;
          
          // Set form values
          setName(profileData.name || '');
          setDescription(profileData.description || '');
          setStoryId(profileData.story_id);
          
          // Set comparable authors
          if (profileData.style_parameters && profileData.style_parameters.comparable_authors) {
            setComparableAuthors(profileData.style_parameters.comparable_authors.join(', '));
          }
          
          // Fetch associated samples
          const { data: profileSamplesData, error: profileSamplesError } = await supabase
            .from('profile_samples')
            .select('sample_id, weight')
            .eq('profile_id', id);
          
          if (profileSamplesError) throw profileSamplesError;
          
          // Set selected samples and weights
          const selectedIds = new Set<string>();
          const weights: Record<string, number> = {};
          
          profileSamplesData?.forEach(item => {
            selectedIds.add(item.sample_id);
            weights[item.sample_id] = item.weight || 1.0;
          });
          
          setSelectedSampleIds(selectedIds);
          setSampleWeights(weights);
          
          // Fetch representative samples
          const { data: repSamples, error: repSamplesError } = await supabase
            .from('representative_samples')
            .select('text_content, description')
            .eq('profile_id', id);
          
          if (!repSamplesError && repSamples) {
            setRepresentativeSamples(repSamples);
          }
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load necessary data');
      } finally {
        setLoadingInitial(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode, initialSampleId]);

  // Update samples list when selectedSampleIds changes
  useEffect(() => {
    // Filter available samples to show selected ones
    const selectedSamples = availableSamples
      .filter(sample => selectedSampleIds.has(sample.id))
      .map(sample => ({
        ...sample,
        weight: sampleWeights[sample.id] || 1.0
      }));
    
    setSamples(selectedSamples);
  }, [availableSamples, selectedSampleIds, sampleWeights]);

  // Handle sample selection
  const handleSampleSelection = (sampleId: string, selected: boolean) => {
    const newSelectedIds = new Set<string>(selectedSampleIds);
    
    if (selected) {
      newSelectedIds.add(sampleId);
      // Initialize weight to 1.0
      setSampleWeights(prev => ({
        ...prev,
        [sampleId]: 1.0
      }));
    } else {
      newSelectedIds.delete(sampleId);
      // Remove weight
      setSampleWeights(prev => {
        const { [sampleId]: _, ...rest } = prev;
        return rest;
      });
    }
    
    setSelectedSampleIds(newSelectedIds);
  };

  // Handle weight change for a sample
  const handleWeightChange = (sampleId: string, weight: number) => {
    setSampleWeights(prev => ({
      ...prev,
      [sampleId]: weight
    }));
  };

  // Add representative example
  const handleAddExample = () => {
    if (!newExampleContent.trim()) {
      return;
    }
    
    setRepresentativeSamples(prev => [
      ...prev,
      {
        text_content: newExampleContent,
        description: newExampleDescription || undefined
      }
    ]);
    
    // Clear inputs
    setNewExampleContent('');
    setNewExampleDescription('');
  };

  // Remove representative example
  const handleRemoveExample = (index: number) => {
    setRepresentativeSamples(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name.trim()) {
      setError('Profile name is required');
      return;
    }
    
    if (selectedSampleIds.size === 0) {
      setError('At least one writing sample must be selected');
      return;
    }
    
    try {
      setCreating(true);
      setError(null);
      
      // Prepare the profile data
      const parsedAuthors = comparableAuthors
        .split(',')
        .map(author => author.trim())
        .filter(author => !!author);
      
      // Prepare the style parameters
      // In a real implementation, this would use the create_style_profile MCP tool
      // For now, we'll create a simple mock object
      const styleParameters = {
        comparable_authors: parsedAuthors,
        sentence_length: {
          preferred: 'Moderate'
        },
        sentence_complexity: {
          level: 'Moderate'
        },
        sentence_variety: {
          level: 'Moderate'
        },
        punctuation: {
          style: 'Standard'
        },
        vocabulary: {
          formality: 'Mixed',
          specificity: 'Moderate',
          uncommon_frequency: 'Low',
          repetition: 'Minimal'
        },
        narrative: {
          pov: 'Third person',
          tense: 'Past',
          showing_vs_telling: 'Balanced',
          description_level: 'Moderate'
        },
        tone: {
          emotional: 'Neutral',
          humor: 'Minimal',
          lyricism: 'Low',
          authorial_presence: 'Moderate'
        },
        devices: {
          metaphor_frequency: 'Occasional',
          simile_frequency: 'Occasional',
          alliteration_frequency: 'Low',
          personification: 'Minimal'
        }
      };
      
      // Create or update the profile
      let profileId = id;
      
      if (isEditMode) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('style_profiles')
          .update({
            name,
            description: description || null,
            story_id: storyId || null,
            style_parameters: styleParameters,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
        
        if (updateError) throw updateError;
        
        // Delete existing profile_samples
        const { error: deleteError } = await supabase
          .from('profile_samples')
          .delete()
          .eq('profile_id', id);
        
        if (deleteError) throw deleteError;
        
        // Delete existing representative_samples
        const { error: deleteRepError } = await supabase
          .from('representative_samples')
          .delete()
          .eq('profile_id', id);
        
        if (deleteRepError) throw deleteRepError;
        
      } else {
        // Create new profile
        const { data: newProfile, error: createError } = await supabase
          .from('style_profiles')
          .insert([{
            name,
            description: description || null,
            story_id: storyId || null,
            style_parameters: styleParameters
          }])
          .select('id')
          .single();
        
        if (createError) throw createError;
        
        profileId = newProfile.id;
      }
      
      // Insert profile_samples
      if (profileId) {
        const profileSamples = Array.from(selectedSampleIds).map(sampleId => ({
          profile_id: profileId,
          sample_id: sampleId,
          weight: sampleWeights[sampleId] || 1.0
        }));
        
        const { error: samplesError } = await supabase
          .from('profile_samples')
          .insert(profileSamples);
        
        if (samplesError) throw samplesError;
        
        // Insert representative samples
        if (representativeSamples.length > 0) {
          const repSamplesData = representativeSamples.map(sample => ({
            profile_id: profileId,
            text_content: sample.text_content,
            description: sample.description || null
          }));
          
          const { error: repError } = await supabase
            .from('representative_samples')
            .insert(repSamplesData);
          
          if (repError) throw repError;
        }
        
        // Navigate to the profile detail page
        navigate(`/profiles/${profileId}`);
      }
      
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Failed to create style profile');
      setCreating(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (isEditMode && id) {
      navigate(`/profiles/${id}`);
    } else {
      navigate('/profiles');
    }
  };

  // Filter sample display
  const [sampleFilter, setSampleFilter] = useState('');
  const filteredAvailableSamples = availableSamples.filter(sample => {
    return !selectedSampleIds.has(sample.id) && // Not already selected
      (sample.title.toLowerCase().includes(sampleFilter.toLowerCase()) || // Title matches filter
       (sample.author && sample.author.toLowerCase().includes(sampleFilter.toLowerCase())) || // Author matches filter
       (sample.sample_type && sample.sample_type.toLowerCase().includes(sampleFilter.toLowerCase()))); // Type matches filter
  });

  // Render loading state
  if (loadingInitial) {
    return (
      <div className="create-profile-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-profile-page">
      <div className="page-header">
        <h1>{isEditMode ? 'Edit Style Profile' : 'Create New Style Profile'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Basic information section */}
        <div className="form-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label htmlFor="name">Profile Name *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this style profile"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this style profile (optional)"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="story">Associated Story</label>
              <select
                id="story"
                value={storyId || ''}
                onChange={(e) => setStoryId(e.target.value || undefined)}
              >
                <option value="">None (optional)</option>
                {stories.map(story => (
                  <option key={story.id} value={story.id}>{story.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="comparable-authors">Comparable Authors</label>
              <input
                id="comparable-authors"
                type="text"
                value={comparableAuthors}
                onChange={(e) => setComparableAuthors(e.target.value)}
                placeholder="Similar authors, separated by commas (optional)"
              />
              <div className="help-text">
                E.g., "Ernest Hemingway, Cormac McCarthy, Jane Austen"
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for samples and examples */}
        <div className="tabs">
          <button 
            type="button"
            className={`tab ${activeTab === 'samples' ? 'active' : ''}`}
            onClick={() => setActiveTab('samples')}
          >
            Writing Samples
          </button>
          <button 
            type="button"
            className={`tab ${activeTab === 'examples' ? 'active' : ''}`}
            onClick={() => setActiveTab('examples')}
          >
            Representative Examples
          </button>
        </div>

        {/* Samples tab content */}
        {activeTab === 'samples' && (
          <div className="tab-content">
            <div className="form-section">
              <h3>Selected Samples ({samples.length})</h3>
              
              {samples.length === 0 ? (
                <div className="no-samples-message">
                  <p>No samples selected yet. Select samples below to include in this profile.</p>
                </div>
              ) : (
                <div className="selected-samples">
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
                          <td className="weight-cell">
                            <input
                              type="range"
                              min="0.1"
                              max="2"
                              step="0.1"
                              value={sampleWeights[sample.id] || 1.0}
                              onChange={(e) => handleWeightChange(sample.id, parseFloat(e.target.value))}
                            />
                            <span className="weight-value">{(sampleWeights[sample.id] || 1.0).toFixed(1)}</span>
                          </td>
                          <td className="actions-cell">
                            <div className="sample-actions">
                              <Link to={`/samples/${sample.id}`} className="button icon" title="View Sample">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </Link>
                              <button 
                                type="button" 
                                className="button icon danger" 
                                onClick={() => handleSampleSelection(sample.id, false)}
                                title="Remove Sample"
                              >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="weight-legend">
                    <div className="legend-item">
                      <span className="legend-label">Weight:</span>
                      <span className="legend-value">0.1</span>
                      <span className="legend-description">Minimal influence</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-value">1.0</span>
                      <span className="legend-description">Standard influence</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-value">2.0</span>
                      <span className="legend-description">Strong influence</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="form-section">
              <h3>Available Samples</h3>
              
              <div className="sample-filter">
                <input
                  type="text"
                  placeholder="Filter by title, author or type..."
                  value={sampleFilter}
                  onChange={(e) => setSampleFilter(e.target.value)}
                />
              </div>
              
              <div className="available-samples">
                {filteredAvailableSamples.length === 0 ? (
                  <div className="no-samples-message">
                    <p>No available samples match your filter.</p>
                    <Link to="/samples/new" className="button secondary">
                      Create New Sample
                    </Link>
                  </div>
                ) : (
                  <div className="samples-grid">
                    {filteredAvailableSamples.map(sample => (
                      <div key={sample.id} className="sample-card">
                        <div className="sample-card-content">
                          <h4>{sample.title}</h4>
                          {sample.author && <p className="author">{sample.author}</p>}
                          {sample.sample_type && <p className="type">{sample.sample_type}</p>}
                          <p className="word-count">{sample.word_count} words</p>
                          <button
                            type="button"
                            className="button primary full-width"
                            onClick={() => handleSampleSelection(sample.id, true)}
                          >
                            Add to Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {filteredAvailableSamples.length > 0 && filteredAvailableSamples.length < 3 && (
                  <div className="add-sample-prompt">
                    <Link to="/samples/new" className="button secondary">
                      Create New Sample
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Examples tab content */}
        {activeTab === 'examples' && (
          <div className="tab-content">
            <div className="form-section">
              <h3>Representative Examples ({representativeSamples.length})</h3>
              <p className="section-description">
                Add examples that showcase this style at its best. These will be displayed as reference for anyone using this profile.
              </p>
              
              <div className="representative-examples">
                {representativeSamples.map((example, index) => (
                  <div key={index} className="example-card">
                    <div className="example-content">
                      {example.text_content.split('\n').map((paragraph, pIndex) => (
                        <p key={pIndex}>{paragraph}</p>
                      ))}
                    </div>
                    
                    {example.description && (
                      <div className="example-description">
                        <h4>Notes:</h4>
                        <p>{example.description}</p>
                      </div>
                    )}
                    
                    <div className="example-actions">
                      <button
                        type="button"
                        className="button icon danger"
                        onClick={() => handleRemoveExample(index)}
                        title="Remove Example"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="add-example">
                  <h4>Add New Example</h4>
                  
                  <div className="form-group">
                    <label htmlFor="example-content">Example Text *</label>
                    <textarea
                      id="example-content"
                      value={newExampleContent}
                      onChange={(e) => setNewExampleContent(e.target.value)}
                      placeholder="Enter a representative text example..."
                      rows={6}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="example-description">Notes (Optional)</label>
                    <textarea
                      id="example-description"
                      value={newExampleDescription}
                      onChange={(e) => setNewExampleDescription(e.target.value)}
                      placeholder="Describe what makes this example representative of the style..."
                      rows={3}
                    />
                  </div>
                  
                  <button
                    type="button"
                    className="button secondary"
                    onClick={handleAddExample}
                    disabled={!newExampleContent.trim()}
                  >
                    Add Example
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form actions */}
        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleCancel} 
            className="button secondary"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="button primary"
            disabled={creating}
          >
            {creating 
              ? (isEditMode ? 'Saving Changes...' : 'Creating Profile...') 
              : (isEditMode ? 'Save Changes' : 'Create Profile')}
          </button>
        </div>
      </form>

      {/* Add styles for the components */}
      <style>{`
        /* General styles */
        .create-profile-page {
          max-width: 1000px;
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

        /* Form styles */
        .profile-form {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .form-section {
          padding: 24px;
          border-bottom: 1px solid #e8e1d9;
        }

        .form-section:last-child {
          border-bottom: none;
        }

        .form-section h2 {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0 0 20px 0;
        }

        .form-section h3 {
          font-size: 16px;
          font-weight: 500;
          color: #654321;
          margin: 0 0 16px 0;
        }

        .section-description {
          font-size: 14px;
          color: #666;
          margin: 0 0 20px 0;
        }

        .form-group {
          margin-bottom: 20px;
          width: 100%;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-row {
          display: flex;
          gap: 24px;
          margin-bottom: 20px;
        }

        .form-row:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #654321;
          margin-bottom: 8px;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #c3b7a9;
          border-radius: 6px;
          font-size: 16px;
          color: #333;
          background-color: white;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #8a6d4d;
          box-shadow: 0 0 0 2px rgba(138, 109, 77, 0.2);
        }

        .help-text {
          font-size: 12px;
          color: #8a6d4d;
          margin-top: 4px;
        }

        /* Tabs */
        .tabs {
          display: flex;
          background-color: #f2eee6;
          border-bottom: 1px solid #e8e1d9;
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
          background-color: white;
        }

        .tab.active:after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 1px;
          background-color: white;
        }

        .tab-content {
          background-color: white;
        }

        /* Sample tables */
        .no-samples-message {
          background-color: #f9f7f4;
          border-radius: 8px;
          padding: 24px;
          text-align: center;
          color: #8a6d4d;
          margin-bottom: 16px;
        }

        .no-samples-message p {
          margin: 0 0 16px 0;
        }

        .samples-table {
          width: 100%;
          border-collapse: collapse;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          margin-bottom: 16px;
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

        .weight-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .weight-value {
          font-size: 14px;
          color: #666;
          min-width: 30px;
        }

        .weight-legend {
          display: flex;
          gap: 20px;
          justify-content: center;
          font-size: 12px;
          color: #8a6d4d;
          margin-bottom: 16px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .legend-label {
          margin-right: 4px;
        }

        .legend-value {
          font-weight: 500;
          color: #654321;
        }

        .sample-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        /* Available samples */
        .sample-filter {
          margin-bottom: 16px;
        }

        .sample-filter input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #c3b7a9;
          border-radius: 6px;
          font-size: 14px;
        }

        .samples-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .sample-card {
          background-color: white;
          border-radius: 8px;
          border: 1px solid #e8e1d9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .sample-card-content {
          padding: 16px;
        }

        .sample-card-content h4 {
          font-size: 16px;
          font-weight: 500;
          color: #333;
          margin: 0 0 8px 0;
        }

        .sample-card-content .author,
        .sample-card-content .type {
          font-size: 14px;
          color: #666;
          margin: 0 0 4px 0;
        }

        .sample-card-content .word-count {
          font-size: 14px;
          color: #8a6d4d;
          margin: 0 0 12px 0;
        }

        .add-sample-prompt {
          text-align: center;
          margin-top: 16px;
        }

        /* Representative examples */
        .representative-examples {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .example-card {
          background-color: white;
          border-radius: 8px;
          border: 1px solid #e8e1d9;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }

        .example-content {
          padding: 16px;
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
          padding: 16px;
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

        .example-actions {
          padding: 12px 16px;
          background-color: #f9f7f4;
          border-top: 1px solid #e8e1d9;
          display: flex;
          justify-content: flex-end;
        }

        .add-example {
          background-color: #f9f7f4;
          border-radius: 8px;
          padding: 20px;
        }

        .add-example h4 {
          font-size: 16px;
          font-weight: 500;
          color: #654321;
          margin: 0 0 16px 0;
        }

        /* Form actions */
        .form-actions {
          padding: 16px 24px;
          background-color: #f9f7f4;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
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
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .full-width {
          width: 100%;
        }

        /* Error message */
        .error-message {
          background-color: #fee2e2;
          padding: 12px 16px;
          border-radius: 6px;
          margin: 0 24px 20px 24px;
          border: 1px solid #fecaca;
        }

        .error-message p {
          color: #b91c1c;
          margin: 0;
          font-size: 14px;
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

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
            gap: 20px;
          }
          
          .samples-table {
            display: block;
            overflow-x: auto;
          }
          
          .weight-legend {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateProfilePage;