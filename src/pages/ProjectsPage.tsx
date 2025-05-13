// /src/pages/ProjectsPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useProject } from '../context/ProjectContext';

// Define Project interface locally to match Supabase schema
interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  cover_image_url?: string;
  genre?: string[];
  tags?: string[];
  sample_count?: number;
}

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { activeProject, changeProject } = useProject();

  // Fetch projects from Supabase
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First check if 'projects' table exists
        const { data: tableData, error: tableError } = await supabase
          .from('projects')
          .select('id')
          .limit(1);
        
        if (tableError) {
          console.error('Error checking projects table:', tableError);
          if (tableError.message.includes('does not exist')) {
            setError('The projects table does not exist yet in the database. Please initialize the database schema first.');
            setLoading(false);
            return;
          } else {
            throw tableError;
          }
        }
        
        // Get projects with a count of associated samples
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            sample_count:samples(count)
          `)
          .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        // Transform the data to have sample_count as a number
        const projectsWithCounts = data?.map(project => ({
          ...project,
          sample_count: project.sample_count?.[0]?.count || 0
        })) || [];
        
        setProjects(projectsWithCounts);
      } catch (err: any) {
        console.error('Error fetching projects:', err);
        
        // Provide more specific error messages based on the error type
        if (err.code === 'PGRST116') {
          setError('Database access error: The "samples" table might not exist yet. Please initialize the database schema.');
        } else if (err.code?.includes('auth')) {
          setError('Authentication error: Please check your Supabase connection settings.');
        } else if (err.message?.includes('Failed to fetch')) {
          setError('Network error: Unable to connect to the database. Please check your internet connection.');
        } else {
          setError(`Failed to load projects: ${err.message || 'Unknown error'}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);

  // Function to set a project as active
  const handleSetActive = (projectId: string) => {
    changeProject(projectId);
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <h3 style={{ 
        fontSize: '1.125rem',
        fontWeight: '500',
        color: '#654321',
        marginBottom: '0.5rem'
      }}>
        No projects yet
      </h3>
      <p style={{ 
        color: '#8a6d4d',
        marginBottom: '1.5rem'
      }}>
        Create your first project to get started
      </p>
      <Link 
        to="/projects/new"
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
        <span style={{ marginRight: '0.25rem' }}>+</span> Create Project
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
          Projects
        </h1>
        <Link 
          to="/projects/new"
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
          <span style={{ marginRight: '0.25rem' }}>+</span> Create Project
        </Link>
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
          <div style={{ marginTop: '0.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#b91c1c' }}>
              Please make sure:
            </p>
            <ul style={{ 
              fontSize: '0.875rem', 
              color: '#b91c1c', 
              paddingLeft: '1.5rem',
              marginTop: '0.25rem'
            }}>
              <li>Your Supabase database is set up properly</li>
              <li>The required tables (projects, samples) exist</li>
              <li>Your API key and URL are correct</li>
              <li>Your internet connection is working</li>
            </ul>
          </div>
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
      ) : projects.length === 0 && !error ? (
        <EmptyState />
      ) : viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {projects.map(project => (
            <div 
              key={project.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                border: `1px solid ${activeProject?.id === project.id ? '#8a6d4d' : '#e8e1d9'}`,
                boxShadow: activeProject?.id === project.id ? '0 0 0 2px rgba(138, 109, 77, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '1rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}>
                  <h3 style={{ 
                    fontWeight: '500',
                    color: '#654321'
                  }}>
                    {project.name}
                  </h3>
                  {activeProject?.id === project.id && (
                    <span style={{
                      fontSize: '0.75rem',
                      backgroundColor: '#fef3c7',
                      color: '#8a6d4d',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      fontWeight: '500'
                    }}>
                      Active
                    </span>
                  )}
                </div>
                
                <p style={{
                  fontSize: '0.875rem',
                  color: '#8a6d4d',
                  marginBottom: '1rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  height: '2.5rem'
                }}>
                  {project.description || 'No description'}
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: '#ab8760',
                  marginBottom: '1rem'
                }}>
                  <span>{project.sample_count} samples</span>
                  <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <Link 
                    to={`/projects/${project.id}`}
                    style={{
                      flex: '1',
                      textAlign: 'center',
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      border: '1px solid #8a6d4d',
                      color: '#8a6d4d',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { 
                      e.currentTarget.style.backgroundColor = '#f8f5f0';
                    }}
                    onMouseOut={(e) => { 
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    View
                  </Link>
                  
                  {activeProject?.id !== project.id && (
                    <button
                      onClick={() => handleSetActive(project.id)}
                      style={{
                        flex: '1',
                        padding: '0.5rem',
                        backgroundColor: '#8a6d4d',
                        border: 'none',
                        color: 'white',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#654321' }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#8a6d4d' }}
                    >
                      Set Active
                    </button>
                  )}
                </div>
              </div>
            </div>
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
            {projects.map((project, index) => (
              <li key={project.id} style={{
                borderBottom: index < projects.length - 1 ? '1px solid #e8e1d9' : 'none'
              }}>
                <div style={{
                  padding: '1rem',
                  backgroundColor: activeProject?.id === project.id ? '#fef9ee' : 'transparent'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ flex: '1' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <h3 style={{ 
                          fontWeight: '500',
                          color: '#654321',
                          marginBottom: '0.25rem'
                        }}>
                          {project.name}
                        </h3>
                        {activeProject?.id === project.id && (
                          <span style={{
                            fontSize: '0.75rem',
                            backgroundColor: '#fef3c7',
                            color: '#8a6d4d',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '9999px',
                            fontWeight: '500'
                          }}>
                            Active
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#8a6d4d',
                        marginBottom: '0.25rem'
                      }}>
                        {project.description || 'No description'}
                      </p>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#ab8760'
                      }}>
                        {project.sample_count} samples • Updated {new Date(project.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      <Link 
                        to={`/projects/${project.id}`}
                        style={{
                          display: 'inline-block',
                          padding: '0.375rem 0.75rem',
                          backgroundColor: 'transparent',
                          border: '1px solid #8a6d4d',
                          color: '#8a6d4d',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          textDecoration: 'none',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { 
                          e.currentTarget.style.backgroundColor = '#f8f5f0';
                        }}
                        onMouseOut={(e) => { 
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        View
                      </Link>
                      
                      {activeProject?.id !== project.id && (
                        <button
                          onClick={() => handleSetActive(project.id)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#8a6d4d',
                            border: 'none',
                            color: 'white',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#654321' }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#8a6d4d' }}
                        >
                          Set Active
                        </button>
                      )}
                    </div>
                  </div>
                </div>
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

export default ProjectsPage;