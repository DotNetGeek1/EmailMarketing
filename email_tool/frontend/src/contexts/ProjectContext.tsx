import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { apiUrl } from '../config';
import { useCustomer } from './CustomerContext';

export interface MarketingGroup {
  id: number;
  project_id: number;
  type: {
    id: number;
    label: string;
    code: string;
  };
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  created_at: string;
  templates_count: number;
  languages_count: number;
  status?: string;
  customer_id?: number;
  marketing_groups?: MarketingGroup[];
  tags?: Tag[];
}

export interface Template {
  id: number;
  project_id: number;
  filename: string;
  placeholders: string[];
  created_at: string;
}

export interface CopyEntry {
  id: number;
  project_id: number;
  locale: string;
  key: string;
  value: string;
  status: string;
  comments?: any[];
  created_at: string;
}

export interface GeneratedEmail {
  id: number;
  project_id: number;
  locale: string;
  html_content: string;
  generated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
  created_at?: string;
  project_count?: number;
}

interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  updateProject: (project: Project) => void;
  templates: Template[];
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  copyEntries: CopyEntry[];
  setCopyEntries: React.Dispatch<React.SetStateAction<CopyEntry[]>>;
  generatedEmails: GeneratedEmail[];
  setGeneratedEmails: React.Dispatch<React.SetStateAction<GeneratedEmail[]>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refreshProjectData: () => Promise<void>;
  updateProjectTags: (tags: Tag[]) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [copyEntries, setCopyEntries] = useState<CopyEntry[]>([]);
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const { selectedCustomer } = useCustomer();

  const handleSetCurrentProject = useCallback((project: Project | null) => {
    // Clear existing data when switching projects
    setTemplates([]);
    setCopyEntries([]);
    setGeneratedEmails([]);
    setActiveTab('overview');
    
    // Ensure the project has the correct tags (or empty array if none)
    if (project) {
      const projectWithTags = {
        ...project,
        tags: project.tags || []
      };
      setCurrentProject(projectWithTags);
    } else {
      setCurrentProject(null);
    }
  }, []);

  const refreshProjectData = useCallback(async () => {
    if (!currentProject || !selectedCustomer) return;
    try {
      // Fetch templates for this project
      const templatesResponse = await fetch(apiUrl(`/templates?project_id=${currentProject.id}&customer_id=${selectedCustomer.id}`));
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData);
      }
      // Fetch copy entries for this project
      const copyResponse = await fetch(apiUrl(`/copy/${currentProject.id}?customer_id=${selectedCustomer.id}`));
      if (copyResponse.ok) {
        const copyData = await copyResponse.json();
        setCopyEntries(copyData);
      }
      // Fetch generated emails for this project
      const emailsResponse = await fetch(apiUrl(`/emails/${currentProject.id}?customer_id=${selectedCustomer.id}`));
      if (emailsResponse.ok) {
        const emailsData = await emailsResponse.json();
        setGeneratedEmails(emailsData);
      }
      // Note: Marketing groups are handled by MarketingGroupContext to avoid infinite loops
    } catch (error) {
      console.error('Error refreshing project data:', error);
    }
  }, [currentProject, selectedCustomer]);

  const updateProjectTags = useCallback((tags: Tag[]) => {
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        tags: tags
      };
      setCurrentProject(updatedProject);
    }
  }, [currentProject]);

  const updateProject = useCallback((project: Project) => {
    setCurrentProject(project);
  }, []);

  const value: ProjectContextType = {
    currentProject,
    setCurrentProject: handleSetCurrentProject,
    updateProject,
    templates,
    setTemplates,
    copyEntries,
    setCopyEntries,
    generatedEmails,
    setGeneratedEmails,
    activeTab,
    setActiveTab,
    refreshProjectData,
    updateProjectTags,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}; 