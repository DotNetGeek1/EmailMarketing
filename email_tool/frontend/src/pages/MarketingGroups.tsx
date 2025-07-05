import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useMarketingGroup } from '../contexts/MarketingGroupContext';
import { useToast } from '../contexts/ToastContext';
import { Page } from '../types/navigation';
import Breadcrumb from '../components/Breadcrumb';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiUrl } from '../config';
import ProjectEmails from '../components/project/ProjectEmails';

interface MarketingGroupsProps {
  onNavigate: (page: Page, params?: Record<string, any>) => void;
  params?: { tab?: 'templates' | 'emails' | 'test' };
}

const MarketingGroups: React.FC<MarketingGroupsProps> = ({ onNavigate, params }) => {
  const { currentProject } = useProject();
  const { 
    marketingGroups, 
    marketingGroupTypes, 
    fetchMarketingGroups, 
    fetchMarketingGroupTypes,
    createMarketingGroup,
    deleteMarketingGroup 
  } = useMarketingGroup();
  const { showSuccess, showError } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<number | ''>('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (currentProject) {
      loadData();
    }
  }, [currentProject?.id]);

  const loadData = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      await Promise.all([
        fetchMarketingGroups(currentProject.id),
        fetchMarketingGroupTypes()
      ]);
    } catch (error) {
      console.error('Error loading marketing groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject || !selectedTypeId) return;
    
    setCreating(true);
    try {
      const newGroup = await createMarketingGroup(currentProject.id, selectedTypeId as number);
      if (newGroup) {
        showSuccess('Marketing Group Created', 'Marketing group has been created successfully.');
        setShowCreateForm(false);
        setSelectedTypeId('');
      } else {
        showError('Creation Failed', 'Failed to create marketing group. Please try again.');
      }
    } catch (error) {
      showError('Creation Failed', 'Failed to create marketing group. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    try {
      const success = await deleteMarketingGroup(groupId);
      if (success) {
        showSuccess('Marketing Group Deleted', 'Marketing group has been deleted successfully.');
      } else {
        showError('Deletion Failed', 'Failed to delete marketing group. Please try again.');
      }
    } catch (error) {
      showError('Deletion Failed', 'Failed to delete marketing group. Please try again.');
    }
  };

  const handleNavigateToGroup = (groupId: number, groupName: string) => {
    onNavigate('marketing-group-detail', {
      projectId: currentProject?.id,
      groupId,
      groupName,
    });
  };

  if (!currentProject) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No project selected</p>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Projects', page: 'projects' as Page },
    { label: currentProject.name, page: 'project-detail' as Page },
    { label: 'Marketing Groups' }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} onNavigate={onNavigate} />

      {/* Marketing Groups List */}
      {marketingGroups.length === 0 ? (
        <div className="text-center py-12 bg-brand-panel rounded-lg border border-brand-dark">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-brand-text mb-2">No marketing groups</h3>
          <p className="text-gray-400 mb-4">Get started by creating your first marketing group.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-brand-accent hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition"
          >
            Create Marketing Group
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {marketingGroups.map((group) => (
            <div
              key={group.id}
              className="bg-brand-panel border border-brand-dark rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-brand-text">{group.type.label}</h3>
                  <p className="text-sm text-gray-400">{group.type.code}</p>
                </div>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title="Delete marketing group"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-gray-400 mb-4">
                Created: {new Date(group.created_at).toLocaleDateString()}
              </div>
              <button
                onClick={() => handleNavigateToGroup(group.id, group.type.label)}
                className="w-full bg-brand-accent hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Group
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Marketing Group Modal */}
      <Modal title="Create Marketing Group" isOpen={showCreateForm} onClose={() => setShowCreateForm(false)}>
        <form onSubmit={handleCreateGroup}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-brand-text mb-2">
              Marketing Group Type
            </label>
            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-brand-dark rounded-lg bg-brand-panel text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent"
              required
            >
              <option value="">Select a type</option>
              {marketingGroupTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label} ({type.code})
                </option>
              ))}
            </select>
          </div>
          
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
              disabled={creating || !selectedTypeId}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-accent border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MarketingGroups; 