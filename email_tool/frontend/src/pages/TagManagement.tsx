import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import { Tag } from '../contexts/CampaignContext';
import { useToast } from '../contexts/ToastContext';
import { apiUrl } from '../config';

const TagManagement: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    description: ''
  });

  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Gray', value: '#6B7280' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Teal', value: '#14B8A6' }
  ];

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/tags'));
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      } else {
        showError('Failed to fetch tags', 'Unable to load tags. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      showError('Failed to fetch tags', 'Unable to load tags. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    try {
      const response = await fetch(apiUrl('/tags'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTags();
        setShowCreateModal(false);
        setFormData({ name: '', color: '#3B82F6', description: '' });
        showSuccess('Tag Created', `${formData.name} has been created successfully.`);
      } else {
        showError('Failed to create tag', 'Unable to create tag. Please try again.');
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      showError('Failed to create tag', 'Unable to create tag. Please try again.');
    }
  };

  const handleEditTag = async () => {
    if (!selectedTag) return;

    try {
      const response = await fetch(apiUrl(`/tags/${selectedTag.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchTags();
        setShowEditModal(false);
        setSelectedTag(null);
        setFormData({ name: '', color: '#3B82F6', description: '' });
        showSuccess('Tag Updated', `${formData.name} has been updated successfully.`);
      } else {
        showError('Failed to update tag', 'Unable to update tag. Please try again.');
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      showError('Failed to update tag', 'Unable to update tag. Please try again.');
    }
  };

  const handleDeleteTag = async () => {
    if (!selectedTag) return;

    try {
      const response = await fetch(apiUrl(`/tags/${selectedTag.id}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTags();
        setShowDeleteModal(false);
        setSelectedTag(null);
        showSuccess('Tag Deleted', `${selectedTag.name} has been deleted successfully.`);
      } else {
        showError('Failed to delete tag', 'Unable to delete tag. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      showError('Failed to delete tag', 'Unable to delete tag. Please try again.');
    }
  };

  const openEditModal = (tag: Tag) => {
    setSelectedTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (tag: Tag) => {
    setSelectedTag(tag);
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tag Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Tag
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tag.name}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(tag)}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => openDeleteModal(tag)}
                  className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            {tag.description && (
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                {tag.description}
              </p>
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>
                {tag.campaign_count || 0} campaigns
              </span>
              <span>
                {tag.created_at ? new Date(tag.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {tags.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No tags yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create your first tag to start organizing your campaigns
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Create Tag
          </button>
        </div>
      )}

      {/* Create Tag Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Tag"
      >
        <div className="space-y-4">
          <FormField
            label="Tag Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter tag name"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color.value
                      ? 'border-gray-900 dark:border-white scale-110'
                      : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <FormField
            label="Description (Optional)"
            type="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter tag description"
          />

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTag}
              disabled={!formData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Tag
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Tag Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Tag"
      >
        <div className="space-y-4">
          <FormField
            label="Tag Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter tag name"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color.value
                      ? 'border-gray-900 dark:border-white scale-110'
                      : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <FormField
            label="Description (Optional)"
            type="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter tag description"
          />

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEditTag}
              disabled={!formData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Update Tag
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Tag Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Tag"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete the tag "{selectedTag?.name}"? This action cannot be undone.
          </p>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteTag}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Delete Tag
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TagManagement; 