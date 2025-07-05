import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { Page } from '../types/navigation';
import Breadcrumb from '../components/Breadcrumb';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import TemplatePreview from '../components/TemplatePreview';
import { apiUrl } from '../config';

interface TemplatesProps {
  onNavigate: (page: Page, params?: Record<string, any>) => void;
  params?: {
    projectId?: number;
    groupId?: number;
    groupName?: string;
  };
}

const Templates: React.FC<TemplatesProps> = ({ onNavigate, params }) => {
  const { currentProject } = useProject();
  const { showSuccess, showError } = useToast();
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const projectId = params?.projectId || currentProject?.id;
  const groupId = params?.groupId;
  const groupName = params?.groupName;

  useEffect(() => {
    if (projectId && groupId) {
      loadTemplates();
    }
  }, [projectId, groupId]);

  const loadTemplates = async () => {
    if (!projectId || !groupId) return;
    setLoading(true);
    try {
      const response = await fetch(apiUrl(`/templates?project_id=${projectId}&marketing_group_id=${groupId}`));
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !projectId || !groupId) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('project_id', projectId.toString());
      formData.append('marketing_group_id', groupId.toString());
      
      const response = await fetch(apiUrl('/template'), {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        showSuccess('Template Uploaded', 'Template has been uploaded successfully.');
        setShowUploadForm(false);
        setSelectedFile(null);
        await loadTemplates();
      } else {
        throw new Error('Failed to upload template');
      }
    } catch (error) {
      showError('Upload Failed', 'Failed to upload template. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      const response = await fetch(apiUrl(`/template/${templateId}`), {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showSuccess('Template Deleted', 'Template has been deleted successfully.');
        await loadTemplates();
      } else {
        showError('Deletion Failed', 'Failed to delete template. Please try again.');
      }
    } catch (error) {
      showError('Deletion Failed', 'Failed to delete template. Please try again.');
    }
  };

  const handleNavigateToCopy = (templateId: number, templateName: string) => {
    onNavigate('copy', { 
      projectId, 
      groupId, 
      groupName,
      templateId, 
      templateName 
    });
  };

  if (!projectId || !groupId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invalid project or marketing group</p>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Projects', page: 'projects' as Page },
    { label: currentProject?.name || 'Project', page: 'project-detail' as Page },
    { label: 'Marketing Groups', page: 'marketing-groups' as Page },
    { label: groupName || 'Marketing Group' }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} onNavigate={onNavigate} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Templates</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage templates for {groupName} marketing group.
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(true)}
          className="bg-brand-accent hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload Template
        </button>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="text-center py-12 bg-brand-panel rounded-lg border border-brand-dark">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-brand-text mb-2">No templates</h3>
          <p className="text-gray-400 mb-4">Get started by uploading your first template.</p>
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-brand-accent hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition"
          >
            Upload Template
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-brand-panel border border-brand-dark rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-brand-text">{template.filename}</h3>
                  <p className="text-sm text-gray-400">
                    {template.placeholders?.length || 0} placeholders
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title="Delete template"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              {/* Template Preview */}
              {template.preview_url && (
                <div className="mb-4">
                  <img 
                    src={template.preview_url} 
                    alt={`Preview of ${template.filename}`}
                    className="w-full h-32 object-cover rounded border border-brand-dark"
                  />
                </div>
              )}
              
              <div className="text-sm text-gray-400 mb-4">
                Created: {new Date(template.created_at).toLocaleDateString()}
              </div>
              
              <button
                onClick={() => handleNavigateToCopy(template.id, template.filename)}
                className="w-full bg-brand-accent hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Manage Copy
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Template Modal */}
      <Modal title="Upload Template" isOpen={showUploadForm} onClose={() => setShowUploadForm(false)}>
        <form onSubmit={handleFileUpload}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-brand-text mb-2">
              HTML Template File
            </label>
            <input
              type="file"
              accept=".html,.htm"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-brand-dark rounded-lg bg-brand-panel text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
              required
            />
                         <p className="text-xs text-gray-400 mt-1">
               Upload an HTML template file. Placeholders should be in the format {'{{placeholder_name}}'}.
             </p>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setShowUploadForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-accent border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Templates; 