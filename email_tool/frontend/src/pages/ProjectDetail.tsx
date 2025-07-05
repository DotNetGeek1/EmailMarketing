import React, { useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import ProjectOverview from '../components/project/ProjectOverview';
import ProjectTemplates from '../components/project/ProjectTemplates';
import ProjectCopy from '../components/project/ProjectCopy';
import ProjectEmails from '../components/project/ProjectEmails';

const ProjectDetail: React.FC = () => {
  const { currentProject, activeTab, setActiveTab, refreshProjectData } = useProject();

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

  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
    { id: 'templates', name: 'Templates', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'copy', name: 'Copy', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { id: 'emails', name: 'Generated Emails', icon: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ProjectOverview />;
      case 'templates':
        return <ProjectTemplates />;
      case 'copy':
        return <ProjectCopy />;
      case 'emails':
        return <ProjectEmails />;
      default:
        return <ProjectOverview />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentProject.name}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage templates, copy, and generated emails for this project.
        </p>
        {currentProject.marketing_group && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {currentProject.marketing_group.code} - {currentProject.marketing_group.name}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ProjectDetail; 