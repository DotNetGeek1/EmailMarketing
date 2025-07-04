import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import TemplateList, { Template } from '../components/TemplateList';
import { apiUrl } from '../config';
import PlaceholderBadge from '../components/PlaceholderBadge';

const Templates: React.FC = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | ''>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleteTimeout, setDeleteTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTemplates();
    fetchCampaigns();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/templates'));
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

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(apiUrl('/campaigns'));
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/html') {
      setSelectedFile(file);
    } else {
      showWarning('Invalid File', 'Please select a valid HTML file.');
    }
  };

  const uploadTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedCampaignId) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('campaign_id', selectedCampaignId.toString());

      const response = await fetch(apiUrl('/template'), {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setTemplates(prev => [result, ...prev]);
        setSelectedFile(null);
        setSelectedCampaignId('');
        setShowUploadForm(false);
        showSuccess('Template Uploaded', 'Template has been uploaded successfully.');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Templates</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload and manage HTML email templates with dynamic placeholders.</p>
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

      <Modal title="Upload HTML Template" isOpen={showUploadForm} onClose={() => setShowUploadForm(false)}>
        <form onSubmit={uploadTemplate}>
          <FormField
            label="Campaign"
            type="select"
                         value={selectedCampaignId.toString()}
             onChange={(e) => setSelectedCampaignId(e.target.value ? parseInt(e.target.value) : '')}
            options={campaigns.map(c => ({ value: c.id.toString(), label: c.name }))}
            required
          />
          <FormField
            label="HTML File"
            type="file"
            onChange={handleFileSelect}
            accept=".html,.htm"
            required
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
            Upload an HTML file with placeholders like {'{{variable_name}}'}
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
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <TemplateList
          templates={templates}
          campaigns={campaigns}
          onPreview={setPreviewTemplate}
          onDelete={deleteTemplate}
        />
      )}

      <Modal 
        title={`Template Preview: ${previewTemplate?.filename}`} 
        isOpen={!!previewTemplate} 
        onClose={() => setPreviewTemplate(null)}
      >
        {previewTemplate && (
          <>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Placeholders:</h4>
              <div className="flex flex-wrap gap-2">
                {previewTemplate.placeholders.map((placeholder, index) => (
                  <PlaceholderBadge key={index} value={placeholder} />
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">HTML Content:</h4>
              <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md text-sm overflow-x-auto max-h-96 text-gray-900 dark:text-gray-100">
                {previewTemplate.content}
              </pre>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Templates; 