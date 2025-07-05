import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import ProjectList, { Project } from '../components/ProjectList';
import { apiUrl } from '../config';
import { useCustomer } from '../contexts/CustomerContext';

const Projects: React.FC = () => {
  const { setCurrentProject } = useProject();
  const { showSuccess, showError, showInfo } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleteTimeout, setDeleteTimeout] = useState<NodeJS.Timeout | null>(null);
  const [customers, setCustomers] = useState<{id: number, name: string}[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [marketingGroups, setMarketingGroups] = useState<{id: number, name: string, code: string}[]>([]);
  const [selectedMarketingGroup, setSelectedMarketingGroup] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
    fetchCustomers();
    fetchMarketingGroups();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(apiUrl('/customers'));
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      setCustomers([]);
    }
  };

  const fetchMarketingGroups = async () => {
    try {
      const response = await fetch(apiUrl('/marketing-groups'));
      if (response.ok) {
        const data = await response.json();
        setMarketingGroups(data);
      }
    } catch (error) {
      setMarketingGroups([]);
    }
  };

  const createCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    setCreatingCustomer(true);
    try {
      const response = await fetch(apiUrl('/customer'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `name=${encodeURIComponent(newCustomerName)}`,
      });
      if (response.ok) {
        const newCustomer = await response.json();
        setCustomers(prev => [newCustomer, ...prev]);
        setSelectedCustomer(newCustomer.id);
        setShowNewCustomer(false);
        setNewCustomerName('');
        showSuccess('Customer Created', `${newCustomer.name} has been created.`);
      } else {
        throw new Error('Failed to create customer');
      }
    } catch (error) {
      showError('Creation Failed', 'Failed to create customer.');
    } finally {
      setCreatingCustomer(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !selectedCustomer) return;
    setCreating(true);
    try {
      let body = `name=${encodeURIComponent(newProjectName)}&customer_id=${selectedCustomer}`;
      if (selectedMarketingGroup) {
        body += `&marketing_group_id=${selectedMarketingGroup}`;
      }
      
      const response = await fetch(apiUrl('/project'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body,
      });
      if (response.ok) {
        const newProject = await response.json();
        setProjects(prev => [newProject, ...prev]);
        setNewProjectName('');
        setSelectedMarketingGroup(null);
        setShowCreateForm(false);
        // Show success toast
        showSuccess('Project Created', `${newProject.name} has been created successfully.`);
        // Automatically open the new project
        openProject(newProject);
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      showError('Creation Failed', 'Failed to create project. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const fetchProjects = async () => {
    if (!selectedCustomer) return;
    try {
      setLoading(true);
      const response = await fetch(apiUrl(`/projects?customer_id=${selectedCustomer}`));
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        setProjects([]);
      }
    } catch (error) {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const openProject = (project: Project) => {
    setCurrentProject(project);
    // Navigate to project detail page
    window.history.pushState({}, '', `/project/${project.id}`);
    // Trigger a custom event to notify App.tsx to change the page
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'project-detail' }));
  };

  const deleteProject = async (id: number) => {
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
      const response = await fetch(apiUrl(`/project/${id}`), {
        method: 'DELETE',
      });
      if (response.ok) {
        setProjects(prev => prev.filter(project => project.id !== id));
        showSuccess('Project Deleted', 'Project has been deleted successfully.');
      } else {
        showError('Deletion Failed', 'Failed to delete project. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      showError('Deletion Failed', 'Failed to delete project. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your email projects and their associated templates.</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-brand-accent hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Project
        </button>
      </div>

      <Modal title="Create New Project" isOpen={showCreateForm} onClose={() => setShowCreateForm(false)}>
        <form onSubmit={createProject}>
          <FormField
            label="Project Name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            required
            placeholder="Enter project name"
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer</label>
            <div className="flex items-center gap-2">
              <select
                value={selectedCustomer || ''}
                onChange={e => setSelectedCustomer(Number(e.target.value))}
                required
                className="bg-brand-panel border border-brand-dark rounded px-2 py-1 text-sm text-[#f4f4f4]"
              >
                <option value="" disabled>Select customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowNewCustomer(true)} className="text-xs text-brand-accent hover:underline">New Customer</button>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marketing Group (Optional)</label>
            <select
              value={selectedMarketingGroup || ''}
              onChange={e => setSelectedMarketingGroup(Number(e.target.value) || null)}
              className="bg-brand-panel border border-brand-dark rounded px-2 py-1 text-sm text-[#f4f4f4]"
            >
              <option value="">Select marketing group...</option>
              {marketingGroups.map(group => (
                <option key={group.id} value={group.id}>{group.name} ({group.code})</option>
              ))}
            </select>
          </div>
            {showNewCustomer && (
              <form onSubmit={createCustomer} className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="bg-brand-panel border border-brand-dark rounded px-2 py-1 text-sm text-[#f4f4f4]"
                  required
                />
                <button type="submit" disabled={creatingCustomer} className="px-2 py-1 text-xs bg-brand-accent text-white rounded">{creatingCustomer ? 'Creating...' : 'Add'}</button>
                <button type="button" onClick={() => setShowNewCustomer(false)} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Cancel</button>
              </form>
            )}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-accent border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <ProjectList
          projects={projects}
          onDelete={deleteProject}
          onOpen={openProject}
        />
      )}
    </div>
  );
};

export default Projects; 