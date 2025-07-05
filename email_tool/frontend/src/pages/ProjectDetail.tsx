import React, { useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { Page } from '../types/navigation';
import ProjectOverview from '../components/project/ProjectOverview';

interface ProjectDetailProps {
  onNavigate?: (page: Page, params?: Record<string, any>) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ onNavigate }) => {
  const { currentProject, refreshProjectData } = useProject();

  useEffect(() => {
    if (currentProject) {
      refreshProjectData();
    }
  }, [currentProject, refreshProjectData]);

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          No Project Selected
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please select a project from the projects list to view its details.
        </p>
      </div>
    );
  }

  const handleNavigateToMarketingGroups = () => {
    if (onNavigate) {
      onNavigate('marketing-groups');
    } else {
      // Fallback for when onNavigate is not provided
      window.dispatchEvent(new CustomEvent('navigate', { detail: 'marketing-groups' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentProject.name}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage marketing groups, templates, and copy for this project.
        </p>
        {currentProject.marketing_groups && currentProject.marketing_groups.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {currentProject.marketing_groups.map((group) => (
              <span key={group.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {group.type.code} - {group.type.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={handleNavigateToMarketingGroups}
          className="bg-brand-panel border border-brand-dark rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-brand-text mb-2">Marketing Groups</h3>
          <p className="text-sm text-gray-400">
            Create and manage marketing groups for this project.
          </p>
        </button>

        <div className="bg-brand-panel border border-brand-dark rounded-lg p-6 text-left opacity-50">
          <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-brand-text mb-2">Templates</h3>
          <p className="text-sm text-gray-400">
            Upload and manage email templates.
          </p>
        </div>

        <div className="bg-brand-panel border border-brand-dark rounded-lg p-6 text-left opacity-50">
          <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-brand-text mb-2">Copy Management</h3>
          <p className="text-sm text-gray-400">
            Manage localized copy for templates.
          </p>
        </div>
      </div>

      {/* Project Overview */}
      <div className="mt-8">
        <ProjectOverview />
      </div>
    </div>
  );
};

export default ProjectDetail; 