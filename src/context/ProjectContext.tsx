import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

interface ProjectContextType {
  activeProject: Project | null;
  projects: Project[];
  loading: boolean;
  changeProject: (projectId: string) => void;
}

const ProjectContext = createContext<ProjectContextType>({
  activeProject: null,
  projects: [],
  loading: true,
  changeProject: () => {},
});

export function useProject() {
  return useContext(ProjectContext);
}

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all projects on initial load
  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('name');
          
        if (error) throw error;
        
        setProjects(data || []);
        
        // If we have projects and no active project, set the first one as active
        if (data && data.length > 0 && !activeProject) {
          setActiveProject(data[0]);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProjects();
  }, []);

  // Function to change the active project
  const changeProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setActiveProject(project);
    }
  };

  const value = {
    activeProject,
    projects,
    loading,
    changeProject
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};