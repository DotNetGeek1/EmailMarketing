import React, { useState } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import PlaceholderBadge from '../PlaceholderBadge';
import { apiUrl } from '../../config';

const statusOptions = [
  { value: 'New', label: 'New' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Sent', label: 'Sent (Read Only)' },
];

const ProjectOverview: React.FC = () => {
  const { currentProject, templates, copyEntries, generatedEmails, updateProject } = useProject();
  const [status, setStatus] = useState(currentProject?.status || 'New');
  const [updating, setUpdating] = useState(false);

  if (!currentProject) return null;

  // Calculate copy completion status
  const templateTags = new Set<string>();
  templates.forEach(template => {
    template.placeholders.forEach(placeholder => {
      templateTags.add(placeholder);
    });
  });

  const tagsWithCopy = new Set<string>();
  copyEntries.forEach(entry => {
    tagsWithCopy.add(entry.key);
  });

  const missingCopyTags = Array.from(templateTags).filter(tag => !tagsWithCopy.has(tag));
  const copyCompletionPercentage = templateTags.size > 0 ? Math.round(((templateTags.size - missingCopyTags.length) / templateTags.size) * 100) : 100;

  const stats = [
    {
      name: 'Templates',
      value: templates.length,
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      color: 'bg-green-500',
    },
    {
      name: 'Copy Entries',
      value: copyEntries.length,
      icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'bg-purple-500',
    },
    {
      name: 'Generated Emails',
      value: generatedEmails.length,
      icon: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      color: 'bg-blue-500',
    },
    {
      name: 'Copy Completion',
      value: `${copyCompletionPercentage}%`,
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: copyCompletionPercentage === 100 ? 'bg-green-500' : copyCompletionPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500',
    },
  ];

  const quickActions = [
    {
      name: 'Upload Template',
      description: 'Add a new HTML template',
      action: () => {/* TODO: Navigate to templates tab */},
      icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
      color: 'bg-green-500',
    },
    {
      name: 'Add Copy',
      description: 'Create localized copy entries',
      action: () => {/* TODO: Navigate to copy tab */},
      icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      color: 'bg-purple-500',
    },
    {
      name: 'Generate Emails',
      description: 'Create emails from templates and copy',
      action: () => {/* TODO: Generate emails */},
      icon: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      color: 'bg-blue-500',
    },
  ];

  // Read-only if status is Sent
  const isReadOnly = status === 'Sent';

  // Status change handler
  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      const response = await fetch(apiUrl(`/project/${currentProject.id}/status`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setStatus(newStatus);
        if (updateProject) updateProject({ ...currentProject, status: newStatus });
      }
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
       {/* Project Info */}
       <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Project Information</h2>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Name</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{currentProject.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {new Date(currentProject.created_at).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Project ID</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{currentProject.id}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {isReadOnly ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  Sent (Read Only)
                </span>
              ) : (
                <select
                  value={status}
                  onChange={handleStatusChange}
                  disabled={updating}
                  className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
            </dd>
          </div>
          {currentProject.marketing_group && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Marketing Group</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {currentProject.marketing_group.code} - {currentProject.marketing_group.name}
                </span>
              </dd>
            </div>
          )}
        </dl>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${stat.color} rounded-md flex items-center justify-center`}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{stat.name}</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

       {/* Quick Actions */}
       <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.name}
              onClick={action.action}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 text-left"
            >
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">{action.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Missing Copy Warning */}
      {missingCopyTags.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Action Required: Missing Copy
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>
                  {missingCopyTags.length} tag{missingCopyTags.length === 1 ? '' : 's'} from your templates {missingCopyTags.length === 1 ? 'needs' : 'need'} copy entries before you can generate emails.
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {missingCopyTags.map((tagName) => (
                    <PlaceholderBadge 
                      key={tagName}
                      value={tagName} 
                      isTag={true}
                    />
                  ))}
                </div>
                <p className="mt-2">
                  <span className="font-medium">Go to the Copy tab to add the missing copy entries.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

     

     
    </div>
  );
};

export default ProjectOverview; 