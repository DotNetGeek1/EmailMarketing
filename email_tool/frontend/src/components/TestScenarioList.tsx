import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import FormField from './FormField';
import LoadingSpinner from './LoadingSpinner';
import { apiUrl } from '../config';
import { useToast } from '../contexts/ToastContext';

export interface TestScenario {
  id: number;
  name: string;
  description: string;
  html_filename: string;
  created_at: string;
  updated_at: string;
  step_count: number;
  latest_result?: {
    status: string;
    execution_time: string;
    duration_ms: number;
  } | null;
}

export interface TestScenarioListProps {
  onSelect: (scenarioId: number) => void;
  selectedScenarioId?: number;
}

const TestScenarioList: React.FC<TestScenarioListProps> = ({ onSelect, selectedScenarioId }) => {
  const { showSuccess, showError } = useToast();
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', file: null as File | null });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchScenarios(); }, []);

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/test-builder/scenarios'));
      const data = await res.json();
      setScenarios(data);
    } catch (e) {
      showError('Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm(f => ({ ...f, file: e.target.files![0] }));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('file', form.file);
      const res = await fetch(apiUrl('/test-builder/scenario'), { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      showSuccess('Scenario created');
      setShowModal(false);
      setForm({ name: '', description: '', file: null });
      fetchScenarios();
    } catch (e) {
      showError('Failed to create scenario');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Test Scenarios</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Scenario
        </button>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-2">
          {scenarios.length === 0 && <div className="text-gray-500">No scenarios yet.</div>}
          {scenarios.map(s => (
            <div
              key={s.id}
              className={`p-4 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${selectedScenarioId === s.id ? 'bg-blue-50 dark:bg-blue-900 border-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={() => onSelect(s.id)}
            >
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{s.name}</div>
                <div className="text-xs text-gray-500">{s.html_filename} &middot; {new Date(s.created_at).toLocaleString()}</div>
                <div className="text-xs text-gray-400">{s.step_count} steps</div>
              </div>
              <div>
                {s.latest_result && (
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${s.latest_result.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {s.latest_result.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Test Scenario">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Scenario Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <FormField label="Description" type="textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <FormField label="HTML File" type="file" accept=".html" onChange={handleFileChange} required />
          <div className="flex justify-end">
            <button type="button" className="mr-2 px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" disabled={uploading}>{uploading ? 'Uploading...' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TestScenarioList; 