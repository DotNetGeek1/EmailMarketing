import React, { useState, useEffect } from 'react';
import { useMarketingGroup, MarketingGroupType } from '../contexts/MarketingGroupContext';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiUrl } from '../config';

const MarketingGroupTypes: React.FC = () => {
  const { marketingGroupTypes, fetchMarketingGroupTypes } = useMarketingGroup();
  const { showSuccess, showError } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newType, setNewType] = useState({ label: '', code: '' });
  const [creating, setCreating] = useState(false);
  const [editingType, setEditingType] = useState<MarketingGroupType | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchMarketingGroupTypes();
    } catch (error) {
      console.error('Error loading marketing group types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.label.trim() || !newType.code.trim()) return;
    
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('label', newType.label);
      formData.append('code', newType.code);
      
      const response = await fetch(apiUrl('/marketing-group-types'), {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        showSuccess('Type Created', 'Marketing group type has been created successfully.');
        setShowCreateForm(false);
        setNewType({ label: '', code: '' });
        await loadData();
      } else {
        showError('Creation Failed', 'Failed to create marketing group type. Please try again.');
      }
    } catch (error) {
      showError('Creation Failed', 'Failed to create marketing group type. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType || !editingType.label.trim() || !editingType.code.trim()) return;
    
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('label', editingType.label);
      formData.append('code', editingType.code);
      
      const response = await fetch(apiUrl(`/marketing-group-types/${editingType.id}`), {
        method: 'PUT',
        body: formData,
      });
      
      if (response.ok) {
        showSuccess('Type Updated', 'Marketing group type has been updated successfully.');
        setEditingType(null);
        await loadData();
      } else {
        showError('Update Failed', 'Failed to update marketing group type. Please try again.');
      }
    } catch (error) {
      showError('Update Failed', 'Failed to update marketing group type. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteType = async (typeId: number) => {
    try {
      const response = await fetch(apiUrl(`/marketing-group-types/${typeId}`), {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showSuccess('Type Deleted', 'Marketing group type has been deleted successfully.');
        await loadData();
      } else {
        showError('Deletion Failed', 'Failed to delete marketing group type. Please try again.');
      }
    } catch (error) {
      showError('Deletion Failed', 'Failed to delete marketing group type. Please try again.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Marketing Group Types</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage the types of marketing groups that can be created for projects.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-brand-accent hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Type
        </button>
      </div>

      {/* Marketing Group Types List */}
      {marketingGroupTypes.length === 0 ? (
        <div className="text-center py-12 bg-brand-panel rounded-lg border border-brand-dark">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-brand-text mb-2">No marketing group types</h3>
          <p className="text-gray-400 mb-4">Get started by creating your first marketing group type.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-brand-accent hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition"
          >
            Create Type
          </button>
        </div>
      ) : (
        <div className="bg-brand-panel border border-brand-dark rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-brand-dark">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Label
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-brand-dark">
              {marketingGroupTypes.map((type) => (
                <tr key={type.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text">
                    {type.label}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {type.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {type.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingType(type)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteType(type.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Marketing Group Type Modal */}
      <Modal title="Create Marketing Group Type" isOpen={showCreateForm} onClose={() => setShowCreateForm(false)}>
        <form onSubmit={handleCreateType}>
          <FormField
            label="Label"
            value={newType.label}
            onChange={(e) => setNewType({ ...newType, label: e.target.value })}
            required
            placeholder="Enter type label"
          />
          <FormField
            label="Code"
            value={newType.code}
            onChange={(e) => setNewType({ ...newType, code: e.target.value })}
            required
            placeholder="Enter type code"
          />
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !newType.label.trim() || !newType.code.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-accent border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Marketing Group Type Modal */}
      <Modal title="Edit Marketing Group Type" isOpen={!!editingType} onClose={() => setEditingType(null)}>
        {editingType && (
          <form onSubmit={handleUpdateType}>
            <FormField
              label="Label"
              value={editingType.label}
              onChange={(e) => setEditingType({ ...editingType, label: e.target.value })}
              required
              placeholder="Enter type label"
            />
            <FormField
              label="Code"
              value={editingType.code}
              onChange={(e) => setEditingType({ ...editingType, code: e.target.value })}
              required
              placeholder="Enter type code"
            />
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setEditingType(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating || !editingType.label.trim() || !editingType.code.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-accent border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default MarketingGroupTypes; 