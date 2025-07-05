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
  const { selectedCustomer } = useCustomer();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleteTimeout, setDeleteTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line
  }, [selectedCustomer]);

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !selectedCustomer) return;
    setCreating(true);
    try {
      const body = `name=${encodeURIComponent(newProjectName)}&customer_id=${selectedCustomer.id}`;
      const response = await fetch(apiUrl('/project'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (response.ok) {
        const newProject = await response.json();
        setProjects(prev => [newProject, ...prev]);
        setNewProjectName('');
        setShowCreateForm(false);
        showSuccess('Project Created', `${newProject.name} has been created successfully.`);
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
      const response = await fetch(apiUrl(`/projects?customer_id=${selectedCustomer.id}`));
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
    window.history.pushState({}, '', `/project/${project.id}`);
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
      showError('Deletion Failed', 'Failed to delete project. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Projects</h1>
          <p className="mt-1 text-sm text-gray-400">Manage your email projects and their associated templates.</p>
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
              disabled={creating}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-accent border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Empty state with Add New Project button */}
      {!loading && projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <svg className="mx-auto h-14 w-14 text-brand-accent mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h3 className="text-lg font-semibold text-brand-text mb-2">No projects yet</h3>
          <p className="mb-6 text-gray-400">Get started by creating your first project for this customer.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-brand-accent hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow transition"
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Project
          </button>
        </div>
      ) : loading ? (
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