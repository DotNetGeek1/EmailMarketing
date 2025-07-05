import React, { useState, useEffect } from 'react';
import { useProject, CopyEntry } from '../../contexts/ProjectContext';
import { useToast } from '../../contexts/ToastContext';
import LoadingSpinner from '../LoadingSpinner';
import PlaceholderBadge from '../PlaceholderBadge';
import Modal from '../Modal';
import { apiUrl } from '../../config';

interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
}

interface CopyData {
  [tagName: string]: {
    [locale: string]: { value: string; status: string; id?: number; comments?: any[] };
  };
}

const ProjectCopy: React.FC = () => {
  const { currentProject, copyEntries, setCopyEntries, templates } = useProject();
  const { showSuccess, showError } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [locales, setLocales] = useState<string[]>(['en']);
  const [copyData, setCopyData] = useState<CopyData>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedCopyEntry, setSelectedCopyEntry] = useState<{ tagName: string; locale: string } | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [addingComment, setAddingComment] = useState(false);

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
    const usedLocales = new Set<string>();

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
      newCopyData[entry.key][entry.locale] = {
        value: entry.value,
        status: entry.status,
        id: entry.id,
        comments: entry.comments || [],
      };
      usedLocales.add(entry.locale);
    });

    setCopyData(newCopyData);
    setLocales(Array.from(usedLocales).sort());
  };

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
      Object.keys(newCopyData).forEach(tagName => {
        if (newCopyData[tagName][localeToRemove]) {
          delete newCopyData[tagName][localeToRemove];
        }
      });
      setCopyData(newCopyData);
    }
  };

  const updateCopyValue = (tagName: string, locale: string, value: string) => {
    setCopyData(prev => ({
      ...prev,
      [tagName]: {
        ...prev[tagName],
        [locale]: {
          ...prev[tagName][locale],
          value,
        },
      },
    }));
  };

  const updateCopyStatus = (tagName: string, locale: string, status: string) => {
    setCopyData(prev => ({
      ...prev,
      [tagName]: {
        ...prev[tagName],
        [locale]: {
          ...prev[tagName][locale],
          status,
        },
      },
    }));
  };

  const saveAllCopy = async () => {
    if (!currentProject) return;
    setSaving(true);
    try {
      const promises: Promise<any>[] = [];
      Object.keys(copyData).forEach(tagName => {
        Object.keys(copyData[tagName]).forEach(locale => {
          const entry = copyData[tagName][locale];
          if (entry.value && entry.value.trim()) {
            const formData = new FormData();
            formData.append('key', tagName);
            formData.append('value', entry.value.trim());
            formData.append('status', entry.status || 'Draft');
            promises.push(
              fetch(apiUrl(`/copy/${currentProject.id}/${locale}`), {
                method: 'POST',
                body: formData,
              })
            );
          }
        });
      });
      await Promise.all(promises);
      const copyResponse = await fetch(apiUrl(`/copy/${currentProject.id}`));
      if (copyResponse.ok) {
        const copyData = await copyResponse.json();
        setCopyEntries(copyData);
      }
      showSuccess('Copy Saved', 'All copy entries have been saved successfully.');
    } catch (error) {
      showError('Save Failed', 'Failed to save copy entries. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openCommentsModal = async (tagName: string, locale: string) => {
    setSelectedCopyEntry({ tagName, locale });
    setShowCommentsModal(true);
    setNewComment('');
    await fetchComments(tagName, locale);
  };

  const fetchComments = async (tagName: string, locale: string) => {
    if (!currentProject) return;
    
    setLoadingComments(true);
    try {
      const response = await fetch(apiUrl(`/copy/${currentProject.id}/${locale}/${tagName}/comments`));
      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const addComment = async () => {
    if (!currentProject || !selectedCopyEntry || !newComment.trim()) return;
    
    setAddingComment(true);
    try {
      const formData = new FormData();
      formData.append('comment', newComment.trim());
      
      const response = await fetch(apiUrl(`/copy/${currentProject.id}/${selectedCopyEntry.locale}/${selectedCopyEntry.tagName}/comments`), {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [...prev, newCommentData]);
        setNewComment('');
        showSuccess('Comment Added', 'Comment has been added successfully.');
      } else {
        throw new Error('Failed to add comment');
      }
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

  if (!currentProject) return null;

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
            Manage localized copy for {currentProject.name}
          </p>
        </div>
        <div className="flex space-x-3">
          <button onClick={addLocale} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Add Locale</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tag</th>
              {locales.map(locale => (
                <th key={locale} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {locale}
                  <button onClick={() => removeLocale(locale)} className="ml-2 text-xs text-red-500">&times;</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tagList.map(tagName => (
              <tr key={tagName}>
                <td className="px-4 py-2 font-mono text-xs text-gray-700 dark:text-gray-200">
                  <PlaceholderBadge value={tagName} isTag={true} />
                </td>
                {locales.map(locale => {
                  const entry = copyData[tagName]?.[locale] || { value: '', status: 'Draft' };
                  return (
                    <td key={locale} className="px-4 py-2">
                      <textarea
                        className="w-full border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900"
                        value={entry.value}
                        onChange={e => updateCopyValue(tagName, locale, e.target.value)}
                        rows={2}
                      />
                      <div className="flex items-center mt-1 space-x-2">
                        <select
                          value={entry.status}
                          onChange={e => updateCopyStatus(tagName, locale, e.target.value)}
                          className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs bg-white dark:bg-gray-900"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                        </select>
                        <button onClick={() => openCommentsModal(tagName, locale)} className="ml-2 text-xs text-blue-500">Comments</button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <button
          onClick={saveAllCopy}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded shadow disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {/* Comments Modal */}
      <Modal
        title={`Comments for ${selectedCopyEntry?.tagName} (${selectedCopyEntry?.locale})`}
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
              className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm bg-white dark:bg-gray-900 resize-none"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={addComment}
                disabled={!newComment.trim() || addingComment}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
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

export default ProjectCopy; 