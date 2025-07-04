import React, { useState, useEffect } from 'react';
import { useCampaign } from '../../contexts/CampaignContext';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../Modal';
import FormField from '../FormField';
import LoadingSpinner from '../LoadingSpinner';
import { apiUrl } from '../../config';
import PlaceholderBadge from '../PlaceholderBadge';

// Interface for templates in this component
interface TemplateItem {
  id: number;
  campaign_id: number;
  filename: string;
  content: string;
  placeholders: string[];
  created_at: string;
}

interface CreatedTag {
  id: number;
  name: string;
  color: string;
  description?: string;
  created_at: string;
}

interface Template {
  id: number;
  campaign_id: number;
  filename: string;
  content: string;
  created_at: string;
  placeholders: string[];
}

const CampaignTemplates: React.FC = () => {
  const { currentCampaign, templates, setTemplates } = useCampaign();
  const { showSuccess, showError, showInfo } = useToast();
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleteTimeout, setDeleteTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentCampaign) {
      fetchTemplates();
    }
  }, [currentCampaign]);

  const fetchTemplates = async () => {
    if (!currentCampaign) return;
    
    try {
      setLoading(true);
      const response = await fetch(apiUrl(`/templates?campaign_id=${currentCampaign.id}`));
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        console.error('Failed to fetch templates');
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/html') {
      setSelectedFile(file);
    } else {
      showError('Invalid File', 'Please select a valid HTML file.');
    }
  };

  const uploadTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !currentCampaign) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('campaign_id', currentCampaign.id.toString());

      const response = await fetch(apiUrl('/template'), {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setTemplates(prev => [result, ...prev]);
        setSelectedFile(null);
        setShowUploadForm(false);
        
        if (result.created_tags && result.created_tags.length > 0) {
          const tagNames = result.created_tags.join(', ');
          showInfo('Template Uploaded', `Template uploaded successfully! New tags created: ${tagNames}. Please add copy for these tags in the Copy tab.`);
        } else {
          showSuccess('Template Uploaded', 'Template uploaded successfully!');
        }
      } else {
        throw new Error('Failed to upload template');
      }
    } catch (error) {
      console.error('Error uploading template:', error);
      showError('Upload Failed', 'Failed to upload template. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const deleteTemplate = async (id: number) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      showInfo('Confirm Delete', 'Click delete again to confirm.');
      if (deleteTimeout) clearTimeout(deleteTimeout);
      setDeleteTimeout(setTimeout(() => setPendingDeleteId(null), 5000));
      return;
    }
    setPendingDeleteId(null);
    if (deleteTimeout) clearTimeout(deleteTimeout);
    try {
      const response = await fetch(apiUrl(`/template/${id}`), {
        method: 'DELETE',
      });
      if (response.ok) {
        setTemplates(prev => prev.filter(template => template.id !== id));
        showSuccess('Template Deleted', 'Template has been deleted successfully.');
      } else {
        showError('Deletion Failed', 'Failed to delete template. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      showError('Deletion Failed', 'Failed to delete template. Please try again.');
    }
  };

  if (!currentCampaign) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Templates</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage HTML templates for {currentCampaign.name}
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload Template
        </button>
      </div>

      <Modal title="Upload Template" isOpen={showUploadForm} onClose={() => setShowUploadForm(false)}>
        <form onSubmit={uploadTemplate}>
          <FormField
            label="HTML Template File"
            type="file"
            onChange={handleFileSelect}
            accept=".html,.htm"
            required
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Upload an HTML file with placeholders (e.g., {'{{tag_name}}'}) that will be replaced with copy.
            <br />
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              💡 New tags will be automatically created from placeholders!
            </span>
          </p>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowUploadForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No templates</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by uploading your first HTML template.</p>
          </div>
        ) : (
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
                          Uploaded {new Date(template.created_at).toLocaleDateString()}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {template.placeholders.map((placeholder, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            >
                              {placeholder}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">Preview</button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        disabled={pendingDeleteId !== null && pendingDeleteId !== template.id}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                      >
                        {pendingDeleteId === template.id ? 'Confirm Delete' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CampaignTemplates; 