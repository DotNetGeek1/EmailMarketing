import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import LoadingSpinner from '../LoadingSpinner';
import { Tag } from '../../contexts/ProjectContext';
import { useToast } from '../../contexts/ToastContext';
import { apiUrl } from '../../config';

interface ProjectTagsProps {
  projectId: number;
  currentTags: Tag[];
  onTagsUpdate: (tags: Tag[]) => void;
}

const ProjectTags: React.FC<ProjectTagsProps> = ({ projectId, currentTags, onTagsUpdate }) => {
  const { showSuccess, showError } = useToast();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchAllTags();
  }, []);

  const fetchAllTags = async () => {
    try {
      const response = await fetch(apiUrl('/tags'));
      if (response.ok) {
        const data = await response.json();
        setAllTags(data);
      } else {
        showError('Failed to fetch tags', 'Unable to load available tags.');
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      showError('Failed to fetch tags', 'Unable to load available tags.');
    }
  };

  const addTagToProject = async (tagId: number) => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl(`/projects/${projectId}/tags/${tagId}`), {
        method: 'POST',
      });

      if (response.ok) {
        const addedTag = allTags.find(tag => tag.id === tagId);
        if (addedTag) {
          onTagsUpdate([...currentTags, addedTag]);
          showSuccess('Tag Added', `${addedTag.name} has been added to the project.`);
        }
        setShowAddModal(false);
      } else {
        showError('Failed to add tag', 'Unable to add tag to project. Please try again.');
      }
    } catch (error) {
      console.error('Error adding tag to project:', error);
      showError('Failed to add tag', 'Unable to add tag to project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeTagFromProject = async (tagId: number) => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl(`/projects/${projectId}/tags/${tagId}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        const removedTag = currentTags.find(tag => tag.id === tagId);
        onTagsUpdate(currentTags.filter(tag => tag.id !== tagId));
        if (removedTag) {
          showSuccess('Tag Removed', `${removedTag.name} has been removed from the project.`);
        }
      } else {
        showError('Failed to remove tag', 'Unable to remove tag from project. Please try again.');
      }
    } catch (error) {
      console.error('Error removing tag from project:', error);
      showError('Failed to remove tag', 'Unable to remove tag from project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const availableTags = allTags.filter(tag => !currentTags.some(currentTag => currentTag.id === tag.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Project Tags</h3>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={availableTags.length === 0}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Tag
        </button>
      </div>

      {currentTags.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <svg className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">No tags assigned to this project</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {currentTags.map((tag) => (
            <div
              key={tag.id}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium group"
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
                border: `1px solid ${tag.color}40`
              }}
            >
              <span>{tag.name}</span>
              <button
                onClick={() => removeTagFromProject(tag.id)}
                disabled={loading}
                className="ml-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-100"
                style={{ color: tag.color }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Tag Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Tag to Project"
      >
        <div className="space-y-4">
          {availableTags.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              All available tags are already assigned to this project.
            </p>
          ) : (
            <div className="space-y-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => addTagToProject(tag.id)}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">{tag.name}</span>
                    {tag.description && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">- {tag.description}</span>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ))}
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default ProjectTags; 