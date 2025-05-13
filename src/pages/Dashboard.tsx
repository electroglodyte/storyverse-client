import React from 'react';
import { Link } from 'react-router-dom';

// Dashboard card component using CSS classes from App.css
const FeatureCard: React.FC<{
  title: string;
  description: string;
  linkTo: string;
  linkText: string;
}> = ({ title, description, linkTo, linkText }) => {
  return (
    <div className="feature-card">
      <h3 className="card-title">{title}</h3>
      <p className="card-description">{description}</p>
      <Link to={linkTo} className="card-link">
        {linkText} <span style={{ marginLeft: '0.25rem' }}>→</span>
      </Link>
    </div>
  );
};

const Dashboard: React.FC = () => {
  // We won't display the Dashboard title here as it's now part of the layout
  return (
    <div style={{ maxWidth: '1000px' }}>
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
  );
};

export default Dashboard;