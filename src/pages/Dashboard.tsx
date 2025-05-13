import React from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

// Dashboard card component using CSS classes from App.css
const FeatureCard: React.FC<{
  title: string;
  description: string;
  linkTo: string;
  linkText: string;
  icon?: string;
}> = ({ title, description, linkTo, linkText, icon }) => {
  return (
    <div className="feature-card">
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        marginBottom: '0.5rem',
        gap: '0.75rem'
      }}>
        {icon && (
          <span style={{
            fontSize: '1.5rem',
            marginTop: '0.125rem'
          }}>
            {icon}
          </span>
        )}
        <div>
          <h3 className="card-title">{title}</h3>
          <p className="card-description">{description}</p>
          <Link to={linkTo} className="card-link">
            {linkText} <span style={{ marginLeft: '0.25rem' }}>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Project card for the projects section
const ProjectCard: React.FC<{
  id: string;
  name: string;
  description?: string;
  sampleCount: number;
  isActive: boolean;
}> = ({ id, name, description, sampleCount, isActive }) => {
  return (
    <Link
      to={`/projects/${id}`}
      style={{
        display: 'block',
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        border: isActive ? '1px solid #8a6d4d' : '1px solid #e8e1d9',
        boxShadow: isActive ? '0 0 0 2px rgba(138, 109, 77, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
        padding: '1rem',
        textDecoration: 'none',
        transition: 'box-shadow 0.2s'
      }}
      onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)' }}
      onMouseOut={(e) => { e.currentTarget.style.boxShadow = isActive ? '0 0 0 2px rgba(138, 109, 77, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '0.5rem'
      }}>
        <h3 style={{ 
          fontWeight: '500',
          color: '#654321',
          fontSize: '1.125rem'
        }}>
          {name}
        </h3>
        {isActive && (
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
        marginBottom: '0.5rem',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        height: '2.5rem'
      }}>
        {description || 'No description'}
      </p>
      <div style={{
        fontSize: '0.75rem',
        color: '#ab8760'
      }}>
        {sampleCount} writing samples
      </div>
    </Link>
  );
};

const Dashboard: React.FC = () => {
  const { activeProject, projects } = useProject();
  
  // Get recent projects (up to 3)
  const recentProjects = projects.slice(0, 3);
  
  return (
    <div style={{ maxWidth: '1200px' }}>
      <h1 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#654321',
        marginBottom: '1.5rem'
      }}>
        Dashboard
      </h1>
      
      {/* Main features */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        <FeatureCard
          title="Projects"
          description="Manage your writing projects and organize your work."
          linkTo="/projects"
          linkText="View Projects"
          icon="📚"
        />
        
        <FeatureCard
          title="Writing Samples"
          description="Manage your writing samples and analyze their style."
          linkTo="/samples"
          linkText="View Samples"
          icon="📝"
        />
        
        <FeatureCard
          title="Style Analysis"
          description="Create and manage style profiles based on your writing."
          linkTo="/style-analysis"
          linkText="View Style Profiles"
          icon="📊"
        />
      </div>
      
      {/* Recent Projects Section */}
      <div style={{ marginBottom: '2.5rem' }}>
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
            Recent Projects
          </h2>
          
          <Link
            to="/projects"
            style={{
              color: '#8a6d4d',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#654321' }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#8a6d4d' }}
          >
            View All <span style={{ marginLeft: '0.25rem' }}>→</span>
          </Link>
        </div>
        
        {recentProjects.length === 0 ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            border: '1px solid #e8e1d9',
            padding: '2rem',
            textAlign: 'center',
            color: '#8a6d4d'
          }}>
            <p style={{ marginBottom: '1rem' }}>No projects yet.</p>
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
                fontSize: '0.875rem',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#654321' }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#8a6d4d' }}
            >
              <span style={{ marginRight: '0.25rem' }}>+</span> Create Project
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem'
          }}>
            {recentProjects.map(project => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                description={project.description}
                sampleCount={0} // Replace with actual count when available
                isActive={activeProject?.id === project.id}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#654321',
          marginBottom: '1rem'
        }}>
          Quick Actions
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <Link
            to="/projects/new"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              border: '1px solid #e8e1d9',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              textDecoration: 'none',
              transition: 'box-shadow 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)' }}
            onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <span style={{ 
              fontSize: '2rem', 
              marginBottom: '0.5rem',
              color: '#8a6d4d'
            }}>
              📚
            </span>
            <span style={{
              fontWeight: '500',
              color: '#654321'
            }}>
              New Project
            </span>
          </Link>
          
          <Link
            to="/samples/new"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              border: '1px solid #e8e1d9',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              textDecoration: 'none',
              transition: 'box-shadow 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)' }}
            onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <span style={{ 
              fontSize: '2rem', 
              marginBottom: '0.5rem',
              color: '#8a6d4d'
            }}>
              📝
            </span>
            <span style={{
              fontWeight: '500',
              color: '#654321'
            }}>
              New Sample
            </span>
          </Link>
          
          <Link
            to="/style-analysis"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              border: '1px solid #e8e1d9',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              textDecoration: 'none',
              transition: 'box-shadow 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)' }}
            onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <span style={{ 
              fontSize: '2rem', 
              marginBottom: '0.5rem',
              color: '#8a6d4d'
            }}>
              📊
            </span>
            <span style={{
              fontWeight: '500',
              color: '#654321'
            }}>
              Analyze Style
            </span>
          </Link>
          
          <Link
            to="/claude-assistant"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              border: '1px solid #e8e1d9',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              textDecoration: 'none',
              transition: 'box-shadow 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)' }}
            onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <span style={{ 
              fontSize: '2rem', 
              marginBottom: '0.5rem',
              color: '#8a6d4d'
            }}>
              💬
            </span>
            <span style={{
              fontWeight: '500',
              color: '#654321'
            }}>
              Claude Assistant
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;