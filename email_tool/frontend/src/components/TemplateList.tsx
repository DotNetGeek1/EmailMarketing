import React from 'react';
import PlaceholderBadge from './PlaceholderBadge';

export interface Template {
  id: number;
  campaign_id: number;
  filename: string;
  content: string;
  created_at: string;
  placeholders: string[];
}

interface Campaign {
  id: number;
  name: string;
}

interface TemplateListProps {
  templates: Template[];
  campaigns: Campaign[];
  onPreview?: (template: Template) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const TemplateList: React.FC<TemplateListProps> = ({ templates, campaigns, onPreview, onEdit, onDelete }) => {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No templates</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by uploading an HTML template.</p>
      </div>
    );
  }
  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {templates.map((template) => (
          <li key={template.id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{template.filename}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Campaign: {campaigns.find(c => c.id === template.campaign_id)?.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Created {new Date(template.created_at).toLocaleDateString()}
                    </div>
                    <div className="mt-2">
                      {template.placeholders.map((placeholder, index) => (
                        <PlaceholderBadge key={index} value={placeholder} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {onPreview && (
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors" onClick={() => onPreview(template)}>
                      Preview
                    </button>
                  )}
                  {onEdit && (
                    <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors" onClick={() => onEdit(template.id)}>
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(template.id)}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TemplateList; 