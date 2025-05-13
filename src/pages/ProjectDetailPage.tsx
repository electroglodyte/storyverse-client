// /src/pages/ProjectDetailPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

// Define the Project interface directly in this file to avoid import issues
interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  status?: string;
  cover_image_url?: string;
  genre?: string[];
  tags?: string[];
}

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Project Details</h1>
      <p>Viewing project with ID: {id}</p>
    </div>
  );
};

export default ProjectDetailPage;