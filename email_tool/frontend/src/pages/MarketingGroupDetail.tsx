import React, { useState, useEffect } from 'react';
import { Page } from '../types/navigation';
import ProjectEmails from '../components/project/ProjectEmails';
import { apiUrl } from '../config';

interface Template {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  preview_image?: string;
}

interface MarketingGroupDetailProps {
  onNavigate: (page: Page, params?: Record<string, any>) => void;
  params?: {
    projectId?: number;
    groupId?: number;
    groupName?: string;
    tab?: 'templates' | 'emails' | 'test';
  };
}

const MarketingGroupDetail: React.FC<MarketingGroupDetailProps> = ({ onNavigate, params }) => {
  const [activeTab, setActiveTab] = useState<'templates' | 'emails' | 'test'>(params?.tab || 'templates');
  const groupName = params?.groupName || 'Marketing Group';
  const groupId = params?.groupId;
  const projectId = params?.projectId;
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (groupId) {
      fetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl(`/templates?marketing_group_id=${groupId}`));
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    setDeletingId(templateId);
    try {
      const response = await fetch(apiUrl(`/template/${templateId}`), {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchTemplates();
      } else {
        alert('Failed to delete template.');
      }
    } catch (error) {
      alert('Failed to delete template.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleNavigateToCopy = (templateId: number, templateName: string) => {
    onNavigate('copy', {
      projectId,
      groupId,
      groupName,
      templateId,
      templateName,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <button onClick={() => onNavigate('marketing-groups', { projectId })} className="text-blue-500 hover:underline">&larr; Back to Groups</button>
        <h1 className="text-2xl font-bold text-brand-text ml-2">{groupName}</h1>
      </div>
      <div className="flex space-x-4 border-b border-gray-700 mb-4">
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'templates' ? 'border-b-2 border-brand-accent text-brand-accent' : 'text-gray-400'}`}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'emails' ? 'border-b-2 border-brand-accent text-brand-accent' : 'text-gray-400'}`}
          onClick={() => setActiveTab('emails')}
        >
          Generated Emails
        </button>
        <button
          className={`px-4 py-2 font-semibold ${activeTab === 'test' ? 'border-b-2 border-brand-accent text-brand-accent' : 'text-gray-400'}`}
          onClick={() => setActiveTab('test')}
          disabled
        >
          Test (Coming Soon)
        </button>
      </div>
      {activeTab === 'templates' && (
        <div>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No templates for this group.</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="bg-brand-panel border border-brand-dark rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-20 h-16 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {template.preview_image ? (
                        <img
                          src={apiUrl(template.preview_image)}
                          alt="Template Preview"
                          className="w-full h-full object-cover"
                          onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = '<div class=\"w-full h-full flex items-center justify-center text-xs text-gray-500\">No preview</div>';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No preview</div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="text-lg font-semibold text-brand-text">{template.name}</div>
                      {template.description && <div className="text-sm text-gray-400">{template.description}</div>}
                      {template.created_at && <div className="text-xs text-gray-500 mt-1">Created: {new Date(template.created_at).toLocaleDateString()}</div>}
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-auto">
                    <button
                      onClick={() => handleNavigateToCopy(template.id, template.name)}
                      className="flex-1 bg-brand-accent hover:bg-blue-700 text-white px-3 py-2 rounded font-semibold shadow transition text-sm"
                    >
                      Manage Copy
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="flex-0 text-red-400 hover:text-red-300 transition-colors px-3 py-2 rounded text-sm border border-red-400"
                      disabled={deletingId === template.id}
                    >
                      {deletingId === template.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'emails' && (
        <ProjectEmails />
      )}
      {activeTab === 'test' && (
        <div className="text-center py-12 text-gray-400">Test builder coming soon.</div>
      )}
    </div>
  );
};

export default MarketingGroupDetail; 