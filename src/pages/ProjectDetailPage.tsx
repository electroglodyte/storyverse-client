import React from 'react';
import { useParams } from 'react-router-dom';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Project Details</h1>
      <p>Viewing project with ID: {id}</p>
    </div>
  );
};

export default ProjectDetailPage;