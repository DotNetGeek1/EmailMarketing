import React, { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';
import FormField from './FormField';
import PlaceholderBadge from './PlaceholderBadge';
import TestExecution from './TestExecution';
import TestStepEditor from './TestStepEditor';
import { apiUrl } from '../config';
import { useToast } from '../contexts/ToastContext';

export interface TestScenarioDetailProps {
  scenarioId: number;
  onBack: () => void;
}

export interface TestStep {
  id: number;
  step_order: number;
  action: string;
  selector?: string;
  value?: string;
  attr?: string;
  description?: string;
}

const ACTIONS = [
  { value: 'click', label: 'Click' },
  { value: 'expectText', label: 'Expect Text' },
  { value: 'expectAttr', label: 'Expect Attribute' },
  { value: 'expectUrlContains', label: 'Expect URL Contains' },
  { value: 'waitForSelector', label: 'Wait For Selector' },
  { value: 'fill', label: 'Fill Input' },
];

const TestScenarioDetail: React.FC<TestScenarioDetailProps> = ({ scenarioId, onBack }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState<any>(null);
  const [testids, setTestids] = useState<any[]>([]);
  const [showAddStep, setShowAddStep] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingStep, setEditingStep] = useState<TestStep | null>(null);
  const [form, setForm] = useState({
    step_order: 1,
    action: 'click',
    selector: '',
    value: '',
    attr: '',
    description: '',
  });
  const [addSelectorType, setAddSelectorType] = useState<'data-testid' | 'custom'>('data-testid');

  useEffect(() => {
    fetchScenario();
    // eslint-disable-next-line
  }, [scenarioId]);

  const fetchScenario = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/test-builder/scenario/${scenarioId}`));
      const data = await res.json();
      setScenario(data);
      setForm(f => ({ ...f, step_order: (data.steps?.length || 0) + 1 }));
      fetchTestids(data.html_content);
    } catch (e) {
      showError('Failed to load scenario');
    } finally {
      setLoading(false);
    }
  };

  const fetchTestids = async (htmlContent: string) => {
    try {
      const res = await fetch(apiUrl(`/test-builder/scenario/${scenarioId}/extract-testids`), { method: 'POST' });
      const data = await res.json();
      setTestids(data.testids || []);
    } catch (e) {
      setTestids([]);
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const payload = { ...form, step_order: Number(form.step_order) };
      const res = await fetch(apiUrl(`/test-builder/scenario/${scenarioId}/step`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add step');
      showSuccess('Step added');
      setShowAddStep(false);
      setForm(f => ({ ...f, step_order: (scenario.steps?.length || 0) + 2, selector: '', value: '', attr: '', description: '' }));
      setAddSelectorType('data-testid');
      fetchScenario();
    } catch (e) {
      showError('Failed to add step');
    } finally {
      setAdding(false);
    }
  };

  const handleCloseAddStep = () => {
    setShowAddStep(false);
    setForm(f => ({ ...f, step_order: (scenario.steps?.length || 0) + 1, selector: '', value: '', attr: '', description: '' }));
    setAddSelectorType('data-testid');
  };

  const handleEditStep = async (updatedStep: TestStep) => {
    try {
      const res = await fetch(apiUrl(`/test-builder/step/${updatedStep.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStep),
      });
      if (!res.ok) throw new Error('Failed to update step');
      showSuccess('Step updated');
      setEditingStep(null);
      fetchScenario();
    } catch (e) {
      showError('Failed to update step');
    }
  };

  const handleDeleteStep = async (stepId: number) => {
    try {
      const res = await fetch(apiUrl(`/test-builder/step/${stepId}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete step');
      showSuccess('Step deleted');
      fetchScenario();
    } catch (e) {
      showError('Failed to delete step');
    }
  };

  if (loading || !scenario) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <button className="mb-4 text-blue-600 hover:underline" onClick={onBack}>&larr; Back to scenarios</button>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{scenario.name}</h2>
        <div className="text-sm text-gray-500 mb-1">{scenario.html_filename}</div>
        <div className="text-sm text-gray-400 mb-2">{scenario.description}</div>
      </div>
      <div className="mb-6">
        <div className="font-semibold mb-1 text-gray-900 dark:text-white">Extracted <code>data-testid</code> selectors:</div>
        <div className="flex flex-wrap gap-2">
          {testids.length === 0 && <span className="text-gray-400">None found</span>}
          {testids.map(t => (
            <PlaceholderBadge key={t.testid} value={t.testid} />
          ))}
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <div className="font-semibold text-gray-900 dark:text-white">Test Steps</div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm" onClick={() => setShowAddStep(true)}>Add Step</button>
      </div>
      <div className="space-y-2 mb-8">
        {scenario.steps.length === 0 && <div className="text-gray-400">No steps yet.</div>}
        {scenario.steps.map((step: TestStep) => (
          <div key={step.id} className="p-3 rounded border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <span className="font-mono text-xs text-gray-400 mr-2">#{step.step_order}</span>
              <span className="font-semibold text-blue-700 dark:text-blue-300 mr-2">{step.action}</span>
              {step.selector && <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded mr-2">{step.selector}</span>}
              {step.value && <span className="font-mono text-xs bg-green-100 dark:bg-green-700 px-2 py-0.5 rounded mr-2">{step.value}</span>}
              {step.attr && <span className="font-mono text-xs bg-yellow-100 dark:bg-yellow-700 px-2 py-0.5 rounded mr-2">{step.attr}</span>}
              {step.description && <span className="text-xs text-gray-500 ml-2">{step.description}</span>}
            </div>
            <button
              onClick={() => setEditingStep(step)}
              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors ml-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      
      <TestExecution scenarioId={scenarioId} onResultUpdate={fetchScenario} />
      
      {editingStep && (
        <TestStepEditor
          step={editingStep}
          onSave={handleEditStep}
          onDelete={handleDeleteStep}
          onCancel={() => setEditingStep(null)}
          isOpen={true}
          testids={testids}
        />
      )}
      
      <Modal isOpen={showAddStep} onClose={handleCloseAddStep} title="Add Test Step" size="lg">
        <form onSubmit={handleAddStep} className="space-y-4">
          <FormField 
            label="Step Order" 
            type="text" 
            value={String(form.step_order)} 
            onChange={e => setForm(f => ({ ...f, step_order: e.target.value }))} 
            required 
            min={1} 
          />
          
          <FormField 
            label="Action" 
            type="select" 
            value={form.action} 
            onChange={e => setForm(f => ({ ...f, action: e.target.value }))} 
            required 
            options={ACTIONS} 
          />

          {/* Selector Type Switch */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selector Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="addSelectorType"
                  value="data-testid"
                  checked={addSelectorType === 'data-testid'}
                  onChange={() => setAddSelectorType('data-testid')}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">data-testid</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="addSelectorType"
                  value="custom"
                  checked={addSelectorType === 'custom'}
                  onChange={() => setAddSelectorType('custom')}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Custom CSS</span>
              </label>
            </div>
          </div>

          {/* Selector Field */}
          {addSelectorType === 'data-testid' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                data-testid Selector
              </label>
              {testids.length > 0 ? (
                <>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={form.selector}
                    onChange={e => setForm(f => ({ ...f, selector: e.target.value }))}
                  >
                    <option value="">Select a data-testid...</option>
                    {testids.map(t => (
                      <option key={t.testid} value={t.testid}>
                        {t.testid}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Found {testids.length} data-testid attributes in the HTML template
                  </p>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    value={form.selector}
                    onChange={e => setForm(f => ({ ...f, selector: e.target.value }))}
                    placeholder="Enter data-testid value"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    No data-testid attributes found. Enter the value manually or use custom CSS selector.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CSS Selector
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                value={form.selector}
                onChange={e => setForm(f => ({ ...f, selector: e.target.value }))}
                placeholder="e.g. .my-class, #my-id, [data-attr='value']"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use CSS selectors like .class, #id, or [attribute='value']
              </p>
            </div>
          )}

          {/* Conditional Fields */}
          {form.action === 'expectAttr' && (
            <FormField 
              label="Attribute Name" 
              value={form.attr} 
              onChange={e => setForm(f => ({ ...f, attr: e.target.value }))} 
              placeholder="e.g. value, href, class" 
              required
            />
          )}

          {(form.action === 'expectText' || form.action === 'expectAttr' || form.action === 'expectUrlContains' || form.action === 'fill') && (
            <FormField 
              label={form.action === 'fill' ? 'Input Value' : 'Expected Value'} 
              value={form.value} 
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))} 
              placeholder={form.action === 'fill' ? 'Text to enter' : 'Expected value'} 
              required
            />
          )}

          <FormField 
            label="Description (optional)" 
            value={form.description} 
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
            placeholder="Brief description of this test step"
          />

          <div className="flex justify-end gap-2 pt-4">
            <button 
              type="button" 
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" 
              onClick={handleCloseAddStep}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors" 
              disabled={adding}
            >
              {adding ? 'Adding...' : 'Add Step'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TestScenarioDetail; 