// /src/pages/ProjectDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useProject } from '../context/ProjectContext';

// Define Project and Sample interfaces locally
interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  cover_image_url?: string;
  genre?: string[];
  tags?: string[];
}

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

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Project>>({});
  const { activeProject, changeProject } = useProject();
  const navigate = useNavigate();

  // Fetch project details and associated samples
  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();
        
        if (projectError) throw projectError;
        
        if (!projectData) {
          throw new Error('Project not found');
        }
        
        setProject(projectData);
        setFormData(projectData);
        
        // Fetch associated samples
        const { data: samplesData, error: samplesError } = await supabase
          .from('samples')
          .select('*')
          .eq('project_id', id)
          .order('updated_at', { ascending: false });
        
        if (samplesError) throw samplesError;
        
        setSamples(samplesData || []);
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectDetails();
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Save project changes
  const handleSaveProject = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: formData.name,
          description: formData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      setProject(data);
      setIsEditing(false);
      
      // If this is the active project, update it in context
      if (activeProject?.id === id) {
        changeProject(id);
      }
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  // Delete project (with confirmation)
  const handleDeleteProject = async () => {
    if (!id || !project) return;
    
    if (!window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Delete associated samples first
      const { error: samplesError } = await supabase
        .from('samples')
        .delete()
        .eq('project_id', id);
      
      if (samplesError) throw samplesError;
      
      // Then delete the project
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      
      if (projectError) throw projectError;
      
      // Navigate back to projects list
      navigate('/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
      setLoading(false);
    }
  };

  // Set this project as active
  const handleSetActive = () => {
    if (id) {
      changeProject(id);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setFormData(project || {});
    setIsEditing(false);
  };

  if (loading && !project) {
    return (
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
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#fee2e2',
        padding: '1rem',
        borderRadius: '0.375rem',
        marginBottom: '1.5rem',
        border: '1px solid #fecaca'
      }}>
        <p style={{ color: '#b91c1c' }}>{error}</p>
        <Link 
          to="/projects"
          style={{
            display: 'inline-block',
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#8a6d4d',
            color: 'white',
            borderRadius: '0.375rem',
            textDecoration: 'none'
          }}
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem 1rem'
      }}>
        <h3 style={{ 
          fontSize: '1.125rem',
          fontWeight: '500',
          color: '#654321',
          marginBottom: '1rem'
        }}>
          Project not found
        </h3>
        <Link 
          to="/projects"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            backgroundColor: '#8a6d4d',
            color: 'white',
            borderRadius: '0.375rem',
            textDecoration: 'none'
          }}
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Project Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.5rem'
          }}>
            <Link 
              to="/projects"
              style={{
                fontSize: '0.875rem',
                color: '#8a6d4d',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <svg style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Projects
            </Link>
            
            {activeProject?.id === project.id && (
              <span style={{
                fontSize: '0.75rem',
                backgroundColor: '#fef3c7',
                color: '#8a6d4d',
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
                fontWeight: '500'
              }}>
                Active Project
              </span>
            )}
          </div>
          
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#654321',
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #c3b7a9',
                borderRadius: '0.375rem',
                marginBottom: '0.5rem'
              }}
            />
          ) : (
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#654321',
              marginBottom: '0.5rem'
            }}>
              {project.name}
            </h1>
          )}
          
          {isEditing ? (
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              placeholder="Add a project description..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #c3b7a9',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                color: '#8a6d4d',
                resize: 'vertical'
              }}
            />
          ) : (
            <p style={{
              fontSize: '0.875rem',
              color: '#8a6d4d',
              maxWidth: '36rem'
            }}>
              {project.description || 'No description'}
            </p>
          )}
          
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: '#ab8760'
          }}>
            Created: {new Date(project.created_at).toLocaleDateString()}
            {project.created_at !== project.updated_at && (
              <span> • Updated: {new Date(project.updated_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          justifyContent: 'flex-end'
        }}>
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
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
                Cancel
              </button>
              
              <button
                onClick={handleSaveProject}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#8a6d4d',
                  border: 'none',
                  color: 'white',
                  borderRadius: '0.375rem',
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#654321' }}
                onMouseOut={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#8a6d4d' }}
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              {activeProject?.id !== project.id && (
                <button
                  onClick={handleSetActive}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#8a6d4d',
                    border: 'none',
                    color: 'white',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#654321' }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#8a6d4d' }}
                >
                  Set as Active
                </button>
              )}
              
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  border: '1px solid #8a6d4d',
                  color: '#8a6d4d',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { 
                  e.currentTarget.style.backgroundColor = '#f8f5f0';
                }}
                onMouseOut={(e) => { 
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Edit
              </button>
              
              <button
                onClick={handleDeleteProject}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fecaca' }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2' }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Samples Section */}
      <div style={{
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#654321'
          }}>
            Writing Samples
          </h2>
          
          <Link
            to="/samples/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.375rem 0.75rem',
              backgroundColor: '#8a6d4d',
              color: 'white',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#654321' }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#8a6d4d' }}
          >
            <span style={{ marginRight: '0.25rem' }}>+</span> Add Sample
          </Link>
        </div>
        
        {samples.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            border: '1px solid #e8e1d9',
            padding: '2rem',
            textAlign: 'center',
            color: '#8a6d4d'
          }}>
            <p style={{ marginBottom: '1rem' }}>No writing samples in this project yet.</p>
            <Link
              to="/samples/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.375rem 0.75rem',
                backgroundColor: '#8a6d4d',
                color: 'white',
                borderRadius: '0.375rem',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#654321' }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#8a6d4d' }}
            >
              <span style={{ marginRight: '0.25rem' }}>+</span> Add Sample
            </Link>
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
              {samples.map((sample, index) => (
                <li key={sample.id} style={{
                  borderBottom: index < samples.length - 1 ? '1px solid #e8e1d9' : 'none'
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
                          color: '#654321',
                          marginBottom: '0.25rem'
                        }}>
                          {sample.title}
                        </h3>
                        {sample.author && (
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#ab8760',
                            marginBottom: '0.25rem'
                          }}>
                            by {sample.author}
                          </p>
                        )}
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#8a6d4d',
                          marginBottom: '0.25rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {sample.excerpt || sample.content.substring(0, 100) + '...'}
                        </p>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#ab8760'
                        }}>
                          {sample.word_count || 0} words • {new Date(sample.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div style={{
                        fontSize: '0.75rem',
                        backgroundColor: '#f2eee6',
                        color: '#8a6d4d',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        marginLeft: '1rem'
                      }}>
                        {sample.sample_type || 'Sample'}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Style Profiles Section (placeholder for future implementation) */}
      <div style={{
        marginBottom: '2rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#654321'
          }}>
            Style Profiles
          </h2>
          
          <Link
            to="/style-analysis"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.375rem 0.75rem',
              backgroundColor: '#8a6d4d',
              color: 'white',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#654321' }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#8a6d4d' }}
          >
            <span style={{ marginRight: '0.25rem' }}>+</span> Create Profile
          </Link>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          border: '1px solid #e8e1d9',
          padding: '2rem',
          textAlign: 'center',
          color: '#8a6d4d'
        }}>
          <p style={{ marginBottom: '1rem' }}>No style profiles in this project yet.</p>
          <Link
            to="/style-analysis"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.375rem 0.75rem',
              backgroundColor: '#8a6d4d',
              color: 'white',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#654321' }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#8a6d4d' }}
          >
            <span style={{ marginRight: '0.25rem' }}>+</span> Create Profile
          </Link>
        </div>
      </div>
      
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

export default ProjectDetailPage;