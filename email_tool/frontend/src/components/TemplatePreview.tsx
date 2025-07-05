import React, { useState, useEffect } from 'react';
import { apiUrl } from '../config';
import LoadingSpinner from './LoadingSpinner';
import PlaceholderBadge from './PlaceholderBadge';

export interface TemplatePreviewData {
  template_id: number;
  filename: string;
  content: string;
  placeholders: string[];
  preview_image: string;
  created_at: string;
}

interface TemplatePreviewProps {
  templateId: number;
  onClose: () => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ templateId, onClose }) => {
  const [previewData, setPreviewData] = useState<TemplatePreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchPreview();
  }, [templateId]);

  const fetchPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(apiUrl(`/template/${templateId}/preview`));
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to load preview');
      }
    } catch (err) {
      setError('Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const regeneratePreview = async () => {
    try {
      setRegenerating(true);
      const response = await fetch(apiUrl(`/template/${templateId}/preview/regenerate`), {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to regenerate preview');
      }
    } catch (err) {
      setError('Failed to regenerate preview');
    } finally {
      setRegenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!previewData?.preview_image) return;
    
    try {
      const response = await fetch(apiUrl(previewData.preview_image));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${previewData.filename.replace('.html', '')}_preview.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Template Preview</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Template Preview</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center py-8">
            <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
            <button
              onClick={fetchPreview}
              className="bg-brand-accent hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!previewData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Template Preview: {previewData.filename}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Preview Image */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Rendered Preview</h3>
              <div className="flex space-x-2">
                <button
                  onClick={regeneratePreview}
                  disabled={regenerating}
                  className="bg-brand-panel border border-brand-dark text-[#f4f4f4] px-3 py-1 rounded text-sm font-semibold shadow transition disabled:opacity-50"
                >
                  {regenerating ? 'Regenerating...' : 'Regenerate'}
                </button>
                <button
                  onClick={downloadImage}
                  className="bg-brand-accent hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-semibold shadow transition"
                >
                  Download
                </button>
              </div>
            </div>
            
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white">
              <img
                src={apiUrl(previewData.preview_image)}
                alt="Template Preview"
                className="w-full h-auto"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div class="p-8 text-center text-gray-500">Failed to load preview image</div>';
                }}
              />
            </div>
          </div>

          {/* Right Column - Template Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Template Information</h3>
              <div className="bg-brand-panel border border-brand-dark rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Created: {new Date(previewData.created_at).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Template ID: {previewData.template_id}
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Placeholders:</h4>
                  <div className="flex flex-wrap gap-2">
                    {previewData.placeholders.map((placeholder, index) => (
                      <PlaceholderBadge key={index} value={placeholder} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">HTML Content</h3>
              <div className="bg-brand-panel border border-brand-dark rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {previewData.content}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview; 