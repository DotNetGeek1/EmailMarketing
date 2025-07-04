import React, { useState, useEffect } from 'react';
import { useCampaign } from '../../contexts/CampaignContext';
import { useToast } from '../../contexts/ToastContext';
import { apiUrl } from '../../config';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';

interface GeneratedEmail {
  id: number;
  language: string;
  html_content: string;
  generated_at: string;
  thumbnail_url?: string;
}

const CampaignEmails: React.FC = () => {
  const { currentCampaign, templates, copyEntries } = useCampaign();
  const { showSuccess, showError, showWarning } = useToast();
  const [generating, setGenerating] = useState(false);
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const [previewEmail, setPreviewEmail] = useState<GeneratedEmail | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  if (!currentCampaign) return null;

  const generateEmails = async () => {
    // Check if templates exist
    if (!templates || templates.length === 0) {
      showWarning('No Templates', 'No templates available. Please upload a template first.');
      return;
    }

    // Check if copy entries exist
    if (!copyEntries || copyEntries.length === 0) {
      showWarning('No Copy', 'No copy entries available. Please add some copy first.');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch(apiUrl(`/generate/${currentCampaign.id}`), {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.emails) {
          setGeneratedEmails(result.emails);
          showSuccess('Emails Generated', `Successfully generated ${result.generated} emails!`);
        } else {
          showWarning('No Emails Generated', 'No emails were generated. Check that you have templates and copy for all required languages.');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate emails');
      }
    } catch (error) {
      console.error('Error generating emails:', error);
      showError('Generation Failed', error instanceof Error ? error.message : 'Failed to generate emails. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getLanguageName = (code: string) => {
    const languageNames: { [key: string]: string } = {
      en: 'English', es: 'Spanish', fr: 'French', de: 'German',
      it: 'Italian', pt: 'Portuguese', ja: 'Japanese', ko: 'Korean', zh: 'Chinese'
    };
    return languageNames[code] || code;
  };

  const downloadEmail = (email: GeneratedEmail) => {
    const blob = new Blob([email.html_content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentCampaign.name}_${email.language}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateThumbnail = (htmlContent: string): string => {
    // Create a simple thumbnail by taking the first 200 characters and wrapping in a styled div
    const preview = htmlContent.replace(/<[^>]*>/g, '').substring(0, 200) + '...';
    return preview;
  };

  const openPreview = (email: GeneratedEmail) => {
    setPreviewEmail(email);
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Generated Emails</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and download emails generated from templates and copy for {currentCampaign.name}
          </p>
        </div>
        <button
          onClick={generateEmails}
          disabled={generating || !templates || templates.length === 0 || !copyEntries || copyEntries.length === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {generating ? 'Generating...' : 'Generate Emails'}
        </button>
      </div>

      {/* Generation Status */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Generation Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{templates?.length || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Templates Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{copyEntries?.length || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Copy Entries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{generatedEmails?.length || 0}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Generated Emails</div>
          </div>
        </div>
      </div>

      {/* Generated Emails List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {!generatedEmails || generatedEmails.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No generated emails</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Generate emails from your templates and copy to see them here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {generatedEmails.map((email) => (
              <li key={email.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {getLanguageName(email.language)} Email
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Generated {new Date(email.generated_at).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {email.html_content.length} characters
                        </div>
                        {/* Thumbnail Preview */}
                        <div className="mt-2">
                          {email.thumbnail_url ? (
                            <img
                              src={apiUrl(email.thumbnail_url)}
                              alt="Email thumbnail"
                              className="rounded border border-gray-200 dark:border-gray-700 max-w-xs max-h-40 object-cover bg-white"
                              style={{ background: '#fff' }}
                            />
                          ) : (
                            <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 max-w-md">
                              {generateThumbnail(email.html_content)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openPreview(email)}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => downloadEmail(email)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Email Preview Modal */}
      <Modal 
        title={`${previewEmail ? getLanguageName(previewEmail.language) : ''} Email Preview`} 
        isOpen={showPreview} 
        onClose={() => setShowPreview(false)}
        size="xl"
      >
        {previewEmail && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Generated {new Date(previewEmail.generated_at).toLocaleString()}
              </div>
              <button
                onClick={() => downloadEmail(previewEmail)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
              >
                Download
              </button>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <iframe
                srcDoc={previewEmail.html_content}
                className="w-full h-96 border-0"
                title="Email Preview"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CampaignEmails; 