import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

// Type definitions
interface WritingSample {
  id: string;
  title: string;
  content: string;
  author?: string;
  sample_type?: string;
  tags?: string[];
  excerpt?: string;
  story_id?: string;
}

interface Story {
  id: string;
  name: string;
}

const CreateSamplePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [sampleType, setSampleType] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [storyId, setStoryId] = useState<string | undefined>(undefined);
  
  // Other state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  
  // Sample types
  const sampleTypes = [
    'Novel',
    'Short Story',
    'Poetry',
    'Screenplay',
    'Dialogue',
    'Description',
    'Action',
    'Character Development',
    'Essay',
    'Other'
  ];
  
  // Load existing sample data if in edit mode
  useEffect(() => {
    const fetchSampleData = async () => {
      if (!isEditMode) return;
      
      try {
        setLoading(true);
        
        // Fetch the writing sample
        const { data: sampleData, error: sampleError } = await supabase
          .from('writing_samples')
          .select('*')
          .eq('id', id)
          .single();
        
        if (sampleError) throw sampleError;
        
        // Set form values
        setTitle(sampleData.title || '');
        setContent(sampleData.content || '');
        setAuthor(sampleData.author || '');
        setSampleType(sampleData.sample_type || '');
        setTagsInput((sampleData.tags || []).join(', '));
        setExcerpt(sampleData.excerpt || '');
        setStoryId(sampleData.story_id);
        
      } catch (err) {
        console.error('Error fetching sample data:', err);
        setError('Failed to load sample data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSampleData();
  }, [id, isEditMode]);
  
  // Load stories for dropdown
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('id, name')
          .order('name');
        
        if (error) throw error;
        
        setStories(data || []);
      } catch (err) {
        console.error('Error fetching stories:', err);
      }
    };
    
    fetchStories();
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    
    try {
      setSaving(true);
      
      // Parse tags
      const tags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => !!tag);
      
      // Create sample object
      const sampleData: Partial<WritingSample> = {
        title,
        content,
        author: author || null,
        sample_type: sampleType || null,
        tags: tags.length > 0 ? tags : null,
        excerpt: excerpt || null,
        story_id: storyId || null
      };
      
      let result;
      
      if (isEditMode) {
        // Update existing sample
        result = await supabase
          .from('writing_samples')
          .update(sampleData)
          .eq('id', id);
      } else {
        // Create new sample
        result = await supabase
          .from('writing_samples')
          .insert([sampleData]);
      }
      
      if (result.error) throw result.error;
      
      // Navigate to sample detail or samples list
      if (isEditMode) {
        navigate(`/samples/${id}`);
      } else if (result.data && result.data[0]) {
        navigate(`/samples/${result.data[0].id}`);
      } else {
        navigate('/samples');
      }
      
    } catch (err) {
      console.error('Error saving sample:', err);
      setError('Failed to save sample');
      setSaving(false);
    }
  };
  
  // Auto-generate excerpt from content
  const generateExcerpt = () => {
    if (!content) return;
    
    // Get first 150 characters, trimmed to the nearest sentence end
    const preview = content.substring(0, 250);
    const lastPeriod = preview.lastIndexOf('.');
    const lastQuestion = preview.lastIndexOf('?');
    const lastExclamation = preview.lastIndexOf('!');
    
    const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
    
    if (lastSentenceEnd > 50) {
      setExcerpt(preview.substring(0, lastSentenceEnd + 1));
    } else {
      setExcerpt(preview + '...');
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    if (isEditMode) {
      navigate(`/samples/${id}`);
    } else {
      navigate('/samples');
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="create-sample-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-sample-page">
      <div className="page-header">
        <h1>{isEditMode ? 'Edit Writing Sample' : 'Create New Writing Sample'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="sample-form">
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this sample"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="author">Author</label>
              <input
                id="author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name (optional)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="sample-type">Sample Type</label>
              <select
                id="sample-type"
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value)}
              >
                <option value="">Select a type (optional)</option>
                {sampleTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <input
                id="tags"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Enter tags separated by commas"
              />
              <div className="help-text">
                Separate tags with commas (e.g. fantasy, character development, dialogue)
              </div>
            </div>

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
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the sample text content"
              rows={15}
              required
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <div className="label-with-button">
              <label htmlFor="excerpt">Excerpt / Summary</label>
              <button 
                type="button" 
                onClick={generateExcerpt} 
                className="button text"
              >
                Auto-generate
              </button>
            </div>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A short excerpt or summary (optional)"
              rows={3}
            />
            <div className="help-text">
              This will be displayed in sample listings and cards
            </div>
          </div>
        </div>

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
            disabled={saving}
          >
            {saving ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Sample')}
          </button>
        </div>
      </form>

      {/* Add styles for the components */}
      <style>{`
        /* General styles */
        .create-sample-page {
          max-width: 900px;
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
        .sample-form {
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

        .label-with-button {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .help-text {
          font-size: 12px;
          color: #8a6d4d;
          margin-top: 4px;
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

        .text {
          background-color: transparent;
          color: #8a6d4d;
          padding: 4px 8px;
          font-size: 12px;
        }

        .text:hover {
          background-color: #f2eee6;
        }

        /* Error message */
        .error-message {
          background-color: #fee2e2;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
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
        }
      `}</style>
    </div>
  );
};

export default CreateSamplePage;