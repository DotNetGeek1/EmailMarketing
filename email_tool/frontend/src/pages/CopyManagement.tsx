import React, { useState, useEffect, useCallback } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import { Page } from '../types/navigation';
import Breadcrumb from '../components/Breadcrumb';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import PlaceholderBadge from '../components/PlaceholderBadge';
import CSVImportModal from '../components/CSVImportModal';
import { apiUrl } from '../config';

interface CopyManagementProps {
  onNavigate: (page: Page, params?: Record<string, any>) => void;
  params?: {
    projectId?: number;
    groupId?: number;
    groupName?: string;
    templateId?: number;
    templateName?: string;
  };
}

interface CopyData {
  [placeholderName: string]: {
    [locale: string]: { 
      copy_text: string; 
      status: string; 
      id?: number; 
      comments?: any[] 
    };
  };
}

interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
}

const CopyManagement: React.FC<CopyManagementProps> = ({ onNavigate, params }) => {
  const { currentProject } = useProject();
  const { showSuccess, showError } = useToast();
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [copyItems, setCopyItems] = useState<any[]>([]); // Used in processCopyEntries function
  const [templatePlaceholders, setTemplatePlaceholders] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [locales, setLocales] = useState<string[]>(['en']);
  const [copyData, setCopyData] = useState<CopyData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedCopyEntry, setSelectedCopyEntry] = useState<{ placeholderName: string; locale: string } | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [generating, setGenerating] = useState(false);

  const projectId = params?.projectId || currentProject?.id;
  const groupId = params?.groupId;
  const groupName = params?.groupName;
  const templateId = params?.templateId;
  const templateName = params?.templateName;

  const processCopyEntries = useCallback((copyEntries: any[], placeholders: string[]) => {
    const newCopyData: CopyData = {};
    const usedLocales = new Set<string>();

    // Initialize copy data for all template placeholders
    placeholders.forEach(placeholder => {
      newCopyData[placeholder] = {};
    });

    // Process existing copy entries
    copyEntries.forEach(entry => {
      if (!newCopyData[entry.placeholder_name]) {
        newCopyData[entry.placeholder_name] = {};
      }
      newCopyData[entry.placeholder_name][entry.locale] = {
        copy_text: entry.copy_text,
        status: entry.status,
        id: entry.id,
        comments: entry.comments || [],
      };
      usedLocales.add(entry.locale);
    });

    setCopyData(newCopyData);
    setLocales(Array.from(usedLocales).sort());
  }, []);

  const loadData = useCallback(async () => {
    if (!projectId || !templateId) return;
    setLoading(true);
    try {
      const [copyResponse, placeholdersResponse, tagsResponse] = await Promise.all([
        fetch(apiUrl(`/localized-copy?project_id=${projectId}&template_id=${templateId}`)),
        fetch(apiUrl(`/placeholders/${templateId}`)),
        fetch(apiUrl('/tags'))
      ]);
      
      let placeholders: string[] = [];
      
      if (placeholdersResponse.ok) {
        const placeholdersData = await placeholdersResponse.json();
        placeholders = placeholdersData.placeholders || [];
        setTemplatePlaceholders(placeholders);
      }
      
      if (copyResponse.ok) {
        const copyData = await copyResponse.json();
        setCopyItems(copyData);
        processCopyEntries(copyData, placeholders);
      }

      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        setTags(tagsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, templateId]);

  const addLocale = () => {
    const newLocale = prompt('Enter new locale code (e.g., en-GB, fr-CA):');
    if (newLocale && !locales.includes(newLocale)) {
      setLocales([...locales, newLocale]);
    }
  };

  const removeLocale = (localeToRemove: string) => {
    if (locales.length > 1) {
      setLocales(locales.filter(l => l !== localeToRemove));
      const newCopyData = { ...copyData };
      Object.keys(newCopyData).forEach(placeholderName => {
        if (newCopyData[placeholderName][localeToRemove]) {
          delete newCopyData[placeholderName][localeToRemove];
        }
      });
      setCopyData(newCopyData);
    }
  };

  const updateCopyValue = (placeholderName: string, locale: string, value: string) => {
    setCopyData(prev => ({
      ...prev,
      [placeholderName]: {
        ...prev[placeholderName],
        [locale]: {
          ...prev[placeholderName][locale],
          copy_text: value,
        },
      },
    }));
  };

  const updateCopyStatus = (placeholderName: string, locale: string, status: string) => {
    setCopyData(prev => ({
      ...prev,
      [placeholderName]: {
        ...prev[placeholderName],
        [locale]: {
          ...prev[placeholderName][locale],
          status,
        },
      },
    }));
  };

  const saveAllCopy = async () => {
    if (!projectId || !templateId) return;
    setSaving(true);
    try {
      const promises: Promise<any>[] = [];
      Object.keys(copyData).forEach(placeholderName => {
        Object.keys(copyData[placeholderName]).forEach(locale => {
          const entry = copyData[placeholderName][locale];
          if (entry.copy_text && entry.copy_text.trim()) {
            const formData = new FormData();
            formData.append('project_id', projectId.toString());
            formData.append('template_id', templateId.toString());
            formData.append('placeholder_name', placeholderName);
            formData.append('copy_text', entry.copy_text.trim());
            formData.append('locale', locale);
            formData.append('status', entry.status || 'Draft');
            promises.push(
              fetch(apiUrl('/localized-copy'), {
                method: 'POST',
                body: formData,
              })
            );
          }
        });
      });
      await Promise.all(promises);
      await loadData();
      showSuccess('Copy Saved', 'All copy entries have been saved successfully.');
    } catch (error) {
      showError('Save Failed', 'Failed to save copy entries. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openCommentsModal = async (placeholderName: string, locale: string) => {
    setSelectedCopyEntry({ placeholderName, locale });
    setShowCommentsModal(true);
    setNewComment('');
    await fetchComments(placeholderName, locale);
  };

  const fetchComments = async (placeholderName: string, locale: string) => {
    if (!projectId) return;
    
    setLoadingComments(true);
    try {
      // For now, we'll use a simple approach - in a real app, you'd have a comments endpoint
      setComments([]);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const addComment = async () => {
    if (!projectId || !selectedCopyEntry || !newComment.trim()) return;
    
    setAddingComment(true);
    try {
      // For now, we'll just add to local state - in a real app, you'd save to backend
      const newCommentData = {
        comment: newComment.trim(),
        created_at: new Date().toISOString()
      };
      setComments(prev => [...prev, newCommentData]);
      setNewComment('');
      showSuccess('Comment Added', 'Comment has been added successfully.');
    } catch (error) {
      console.error('Error adding comment:', error);
      showError('Comment Failed', 'Failed to add comment. Please try again.');
    } finally {
      setAddingComment(false);
    }
  };

  const closeCommentsModal = () => {
    setShowCommentsModal(false);
    setSelectedCopyEntry(null);
    setComments([]);
    setNewComment('');
  };

  const handleGenerateEmails = async () => {
    if (!projectId) return;
    setGenerating(true);
    try {
      const response = await fetch(apiUrl(`/generate/${projectId}`), { method: 'POST' });
      if (response.ok) {
        showSuccess('Emails Generated', 'Emails have been generated successfully.');
        onNavigate('marketing-groups', { projectId, tab: 'emails' });
      } else {
        showError('Generation Failed', 'Failed to generate emails.');
      }
    } catch (error) {
      showError('Generation Failed', 'Failed to generate emails.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (projectId && templateId) {
      loadData();
    }
  }, [projectId, templateId, loadData]);

  if (!projectId || !templateId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invalid project or template</p>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Projects', page: 'projects' as Page },
    { label: currentProject?.name || 'Project', page: 'project-detail' as Page },
    { label: 'Marketing Groups', page: 'marketing-groups' as Page },
    { label: groupName || 'Marketing Group', page: 'templates' as Page, params: { projectId, groupId, groupName } },
    { label: templateName || 'Template' }
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
          <h1 className="text-2xl font-bold text-brand-text">Copy Management</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage localized copy for {templateName} template.
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowImportModal(true)} 
            className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700 transition-colors"
          >
            Import CSV
          </button>
          <button 
            onClick={addLocale} 
            className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
          >
            Add Locale
          </button>
          <button
            onClick={handleGenerateEmails}
            disabled={generating}
            className="px-3 py-1 rounded bg-brand-accent text-white text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Email'}
          </button>
        </div>
      </div>

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={() => { setShowImportModal(false); loadData(); }}
        projects={[{ id: projectId!, name: currentProject?.name || 'Project' }]}
        availableTags={tags}
        templateId={templateId!}
      />

      {/* Copy Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Placeholder</th>
              {locales.map(locale => (
                <th key={locale} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {locale}
                  {locale !== 'en' && (
                    <button 
                      onClick={() => removeLocale(locale)} 
                      className="ml-2 text-xs text-red-500 hover:text-red-700"
                    >
                      &times;
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {templatePlaceholders.map(placeholderName => (
              <tr key={placeholderName}>
                <td className="px-4 py-2 font-mono text-xs text-gray-700 dark:text-gray-200">
                  <PlaceholderBadge value={placeholderName} isTag={true} />
                </td>
                {locales.map(locale => {
                  const entry = copyData[placeholderName]?.[locale] || { copy_text: '', status: 'Draft' };
                  return (
                    <td key={locale} className="px-4 py-2">
                      <textarea
                        className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        value={entry.copy_text}
                        onChange={e => updateCopyValue(placeholderName, locale, e.target.value)}
                        rows={2}
                        placeholder={`Enter ${placeholderName} for ${locale}...`}
                      />
                      <div className="flex items-center mt-1 space-x-2">
                        <select
                          value={entry.status}
                          onChange={e => updateCopyStatus(placeholderName, locale, e.target.value)}
                          className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                        </select>
                        <button 
                          onClick={() => openCommentsModal(placeholderName, locale)} 
                          className="ml-2 text-xs text-blue-500 hover:text-blue-700"
                        >
                          Comments
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveAllCopy}
          disabled={saving}
          className="px-6 py-2 bg-brand-accent text-white rounded shadow disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {/* Comments Modal */}
      <Modal
        title={`Comments for ${selectedCopyEntry?.placeholderName} (${selectedCopyEntry?.locale})`}
        isOpen={showCommentsModal}
        onClose={closeCommentsModal}
      >
        <div className="space-y-4">
          {/* Comments List */}
          <div className="max-h-64 overflow-y-auto space-y-3">
            {loadingComments ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No comments yet</p>
            ) : (
              comments.map((comment, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-900 dark:text-white">{comment.comment}</p>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Add Comment Form */}
          <div className="border-t pt-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={addComment}
                disabled={!newComment.trim() || addingComment}
                className="px-4 py-2 bg-brand-accent text-white rounded text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                {addingComment ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CopyManagement; 