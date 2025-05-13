// /src/pages/NewProjectPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useProject } from '../context/ProjectContext';

// Define Project interface locally
interface ProjectForm {
  name: string;
  description?: string;
  genre?: string;
  tags?: string;
}

const NewProjectPage: React.FC = () => {
  const [formData, setFormData] = useState<ProjectForm>({
    name: '',
    description: '',
    genre: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { changeProject } = useProject();

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Create new project
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      setError('Project name is required');
      setErrorDetails('Please provide a name for your project to continue.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setErrorDetails(null);
      
      // First check if projects table exists
      try {
        const { error: tableError } = await supabase
          .from('projects')
          .select('id')
          .limit(1);
        
        if (tableError) {
          console.error('Error checking projects table:', tableError);
          if (tableError.code === 'PGRST116') {
            setError('Database error: The "projects" table does not exist');
            setErrorDetails('The database needs to be set up with the required tables. Please check your Supabase database setup.');
            setLoading(false);
            return;
          } else if (tableError.message?.includes('auth')) {
            setError('Authentication error: Please check your Supabase connection settings');
            setErrorDetails('Your API key might not have the necessary permissions to access data.');
            setLoading(false);
            return;
          } else if (tableError.message?.includes('Failed to fetch')) {
            setError('Network error: Unable to connect to the database');
            setErrorDetails('Please check your internet connection and try again.');
            setLoading(false);
            return;
          } else {
            throw tableError;
          }
        }
      } catch (tableErr: any) {
        console.error('Error checking database tables:', tableErr);
        setError('Database connection error');
        setErrorDetails(tableErr.message || 'Could not verify database structure. Please try again later.');
        setLoading(false);
        return;
      }
      
      // Process tags and genre as arrays if provided
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : undefined;
      const genreArray = formData.genre ? formData.genre.split(',').map(genre => genre.trim()) : undefined;
      
      // Create project in Supabase
      const now = new Date().toISOString();
      const { data, error: createError } = await supabase
        .from('projects')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            tags: tagsArray,
            genre: genreArray,
            created_at: now,
            updated_at: now
          }
        ])
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating project:', createError);
        
        // Provide specific error messages based on error code
        if (createError.code === 'PGRST116') {
          setError('Database access error: The "projects" table might not exist yet');
          setErrorDetails('Please make sure your database is properly set up with the required tables');
        } else if (createError.code === '23505') {
          setError('A project with this name already exists');
          setErrorDetails('Please use a different name for your project');
        } else if (createError.message?.includes('auth')) {
          setError('Authentication error: Please check your Supabase connection settings');
          setErrorDetails('Your API key might not have the necessary permissions to create data');
        } else {
          setError(`Failed to create project: ${createError.message || 'Unknown error'}`);
          setErrorDetails('There was an error while trying to save your project to the database');
        }
        
        setLoading(false);
        return;
      }
      
      // Set as active project if created successfully
      if (data) {
        changeProject(data.id);
      }
      
      setSubmitted(true);
      
      // Navigate to the new project after 1 second
      setTimeout(() => {
        navigate(`/projects/${data.id}`);
      }, 1000);
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError('Failed to create project');
      setErrorDetails(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '36rem',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <Link 
          to="/projects"
          style={{
            fontSize: '0.875rem',
            color: '#8a6d4d',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            marginRight: '0.75rem'
          }}
        >
          <svg style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Projects
        </Link>
        
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#654321'
        }}>
          Create New Project
        </h1>
      </div>
      
      {submitted ? (
        <div style={{
          backgroundColor: '#f0fdf4',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #bbf7d0',
          textAlign: 'center'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem',
            fontWeight: '500',
            color: '#166534',
            marginBottom: '0.5rem'
          }}>
            Project Created Successfully!
          </h3>
          <p style={{ 
            color: '#16a34a',
            marginBottom: '1rem'
          }}>
            Redirecting to your new project...
          </p>
          <div style={{
            width: '1.5rem',
            height: '1.5rem',
            borderRadius: '50%',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '#16a34a transparent #16a34a transparent',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          border: '1px solid #e8e1d9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          padding: '1.5rem'
        }}>
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              padding: '1rem',
              borderRadius: '0.375rem',
              marginBottom: '1.5rem',
              border: '1px solid #fecaca'
            }}>
              <p style={{ 
                color: '#b91c1c',
                fontWeight: '500',
                marginBottom: errorDetails ? '0.5rem' : '0'
              }}>
                {error}
              </p>
              {errorDetails && (
                <p style={{ 
                  color: '#b91c1c',
                  fontSize: '0.875rem'
                }}>
                  {errorDetails}
                </p>
              )}
              
              <div style={{ 
                marginTop: '0.75rem',
                fontSize: '0.75rem',
                color: '#b91c1c'
              }}>
                <p>Common troubleshooting steps:</p>
                <ul style={{ 
                  paddingLeft: '1.25rem',
                  marginTop: '0.25rem',
                  marginBottom: '0'
                }}>
                  <li>Check your database connection and API keys</li>
                  <li>Verify that the required tables exist in your Supabase project</li>
                  <li>Make sure your internet connection is working</li>
                </ul>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="name"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#654321',
                  marginBottom: '0.5rem'
                }}
              >
                Project Name <span style={{ color: '#b91c1c' }}>*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter project name"
                required
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  border: '1px solid #c3b7a9',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="description"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#654321',
                  marginBottom: '0.5rem'
                }}
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter project description"
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  border: '1px solid #c3b7a9',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor="genre"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#654321',
                  marginBottom: '0.5rem'
                }}
              >
                Genre(s)
              </label>
              <input
                type="text"
                id="genre"
                name="genre"
                value={formData.genre}
                onChange={handleInputChange}
                placeholder="E.g., Fantasy, Sci-Fi, Mystery (comma separated)"
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  border: '1px solid #c3b7a9',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <label 
                htmlFor="tags"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#654321',
                  marginBottom: '0.5rem'
                }}
              >
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="E.g., novel, draft, in-progress (comma separated)"
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  border: '1px solid #c3b7a9',
                  borderRadius: '0.375rem',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}>
              <Link
                to="/projects"
                style={{
                  padding: '0.625rem 1.25rem',
                  border: '1px solid #c3b7a9',
                  borderRadius: '0.375rem',
                  backgroundColor: 'white',
                  color: '#654321',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f2eee6' }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white' }}
              >
                Cancel
              </Link>
              
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#8a6d4d',
                  border: 'none',
                  color: 'white',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#654321' }}
                onMouseOut={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#8a6d4d' }}
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
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

export default NewProjectPage;