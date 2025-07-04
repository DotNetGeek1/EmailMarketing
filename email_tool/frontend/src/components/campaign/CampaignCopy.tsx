import React, { useState, useEffect } from 'react';
import { useCampaign, CopyEntry } from '../../contexts/CampaignContext';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../LoadingSpinner';
import PlaceholderBadge from '../PlaceholderBadge';
import { apiUrl } from '../../config';

interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
}

interface CopyData {
  [tagName: string]: {
    [language: string]: string;
  };
}

const CampaignCopy: React.FC = () => {
  const { currentCampaign, copyEntries, setCopyEntries, templates } = useCampaign();
  const { showSuccess, showError } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [languages, setLanguages] = useState<string[]>(['en']);
  const [copyData, setCopyData] = useState<CopyData>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const availableLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'];

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    if (copyEntries.length > 0) {
      processCopyEntries();
    }
  }, [copyEntries]);

  const fetchTags = async () => {
    try {
      const response = await fetch(apiUrl('/tags'));
      if (response.ok) {
        const tagsData = await response.json();
        setTags(tagsData);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      showError('Failed to fetch tags', 'Unable to load available tags.');
    }
  };

  const processCopyEntries = () => {
    const newCopyData: CopyData = {};
    const usedLanguages = new Set<string>();

    // Get all unique tags from templates
    const templateTags = new Set<string>();
    templates.forEach(template => {
      template.placeholders.forEach(placeholder => {
        templateTags.add(placeholder);
      });
    });

    // Initialize copy data for all template tags
    Array.from(templateTags).forEach(tagName => {
      newCopyData[tagName] = {};
    });

    // Process existing copy entries
    copyEntries.forEach(entry => {
      if (!newCopyData[entry.key]) {
        newCopyData[entry.key] = {};
      }
      newCopyData[entry.key][entry.language] = entry.value;
      usedLanguages.add(entry.language);
    });

    setCopyData(newCopyData);
    setLanguages(Array.from(usedLanguages).sort());
  };

  const addLanguage = () => {
    const unusedLanguages = availableLanguages.filter(lang => !languages.includes(lang));
    if (unusedLanguages.length > 0) {
      setLanguages([...languages, unusedLanguages[0]]);
    }
  };

  const removeLanguage = (languageToRemove: string) => {
    if (languages.length > 1) {
      setLanguages(languages.filter(lang => lang !== languageToRemove));
      
      // Remove copy data for this language
      const newCopyData = { ...copyData };
      Object.keys(newCopyData).forEach(tagName => {
        if (newCopyData[tagName][languageToRemove]) {
          delete newCopyData[tagName][languageToRemove];
        }
      });
      setCopyData(newCopyData);
    }
  };

  const updateCopyValue = (tagName: string, language: string, value: string) => {
    setCopyData(prev => ({
      ...prev,
      [tagName]: {
        ...prev[tagName],
        [language]: value
      }
    }));
  };

  const saveAllCopy = async () => {
    if (!currentCampaign) return;
    
    setSaving(true);
    try {
      const promises: Promise<any>[] = [];
      
      // Collect all copy entries to save
      Object.keys(copyData).forEach(tagName => {
        Object.keys(copyData[tagName]).forEach(language => {
          const value = copyData[tagName][language];
          if (value && value.trim()) {
            const formData = new FormData();
            formData.append('key', tagName);
            formData.append('value', value.trim());
            
            promises.push(
              fetch(apiUrl(`/copy/${currentCampaign.id}/${language}`), {
                method: 'POST',
                body: formData,
              })
            );
          }
        });
      });

      await Promise.all(promises);
      
      // Refresh copy entries from backend
      const copyResponse = await fetch(apiUrl(`/copy/${currentCampaign.id}`));
      if (copyResponse.ok) {
        const copyData = await copyResponse.json();
        setCopyEntries(copyData);
      }
      
      showSuccess('Copy Saved', 'All copy entries have been saved successfully.');
    } catch (error) {
      console.error('Error saving copy:', error);
      showError('Save Failed', 'Failed to save copy entries. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getLanguageName = (code: string) => {
    const languageNames: { [key: string]: string } = {
      en: 'English', es: 'Spanish', fr: 'French', de: 'German',
      it: 'Italian', pt: 'Portuguese', ja: 'Japanese', ko: 'Korean', zh: 'Chinese'
    };
    return languageNames[code] || code;
  };

  if (!currentCampaign) return null;

  // Get all unique tags from templates
  const templateTags = new Set<string>();
  templates.forEach(template => {
    template.placeholders.forEach(placeholder => {
      templateTags.add(placeholder);
    });
  });

  const tagList = Array.from(templateTags).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Copy Management</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage localized copy for {currentCampaign.name}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={addLanguage}
            disabled={languages.length >= availableLanguages.length}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Language
          </button>
          <button
            onClick={saveAllCopy}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save All Copy
              </>
            )}
          </button>
        </div>
      </div>

      {tagList.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload a template to start managing copy.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tags
                  </th>
                  {languages.map(language => (
                    <th key={language} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center justify-between">
                        <span>{getLanguageName(language)}</span>
                        {languages.length > 1 && (
                          <button
                            onClick={() => removeLanguage(language)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title={`Remove ${getLanguageName(language)}`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tagList.map(tagName => (
                  <tr key={tagName} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PlaceholderBadge 
                        value={tagName} 
                        isTag={true}
                        color={tags.find(t => t.name === tagName)?.color}
                      />
                    </td>
                    {languages.map(language => (
                      <td key={language} className="px-6 py-4">
                        <textarea
                          value={copyData[tagName]?.[language] || ''}
                          onChange={(e) => updateCopyValue(tagName, language, e.target.value)}
                          placeholder={`Enter ${getLanguageName(language)} copy for ${tagName}`}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white text-sm resize-none"
                          rows={2}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignCopy; 