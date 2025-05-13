import React from 'react';
import { Link } from 'react-router-dom';

const FeatureCard: React.FC<{
  title: string;
  description: string;
  linkTo: string;
  linkText: string;
}> = ({ title, description, linkTo, linkText }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-primary-700 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link to={linkTo} className="text-primary-600 hover:text-primary-700 font-medium">
        {linkText} <span className="ml-1">→</span>
      </Link>
    </div>
  );
};

const Dashboard: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary-700 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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