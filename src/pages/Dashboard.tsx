import React from 'react';
import { Link } from 'react-router-dom';

// Dashboard card component with inline styles for consistency
const FeatureCard: React.FC<{
  title: string;
  description: string;
  linkTo: string;
  linkText: string;
}> = ({ title, description, linkTo, linkText }) => {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      border: '1px solid #e8e1d9',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }}>
      <h3 style={{ 
        fontSize: '1.125rem', 
        fontWeight: '500', 
        color: '#654321', 
        marginBottom: '0.5rem' 
      }}>
        {title}
      </h3>
      <p style={{ 
        color: '#8a6d4d', 
        marginBottom: '1rem' 
      }}>
        {description}
      </p>
      <Link 
        to={linkTo} 
        style={{ 
          color: '#8a6d4d', 
          fontWeight: '500',
          textDecoration: 'none'
        }}
        onMouseOver={(e) => { e.currentTarget.style.color = '#654321' }}
        onMouseOut={(e) => { e.currentTarget.style.color = '#8a6d4d' }}
      >
        {linkText} <span style={{ marginLeft: '0.25rem' }}>→</span>
      </Link>
    </div>
  );
};

const Dashboard: React.FC = () => {
  return (
    <div>
      <h1 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#654321',
        marginBottom: '1.5rem'
      }}>
        Dashboard
      </h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        <FeatureCard
          title="Writing Samples"
          description="Manage your writing samples and analyze their style."
          linkTo="/samples"
          linkText="View Samples"
        />
        
        <FeatureCard
          title="Style Analysis"
          description="Create and manage style profiles based on your writing."
          linkTo="/style-analysis"
          linkText="View Style Profiles"
        />
        
        <FeatureCard
          title="Claude Assistant"
          description="Get writing assistance with context from your project."
          linkTo="/claude-assistant"
          linkText="Open Claude"
        />
      </div>
    </div>
  );
};

export default Dashboard;