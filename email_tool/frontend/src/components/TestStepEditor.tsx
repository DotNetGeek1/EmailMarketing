import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import FormField from './FormField';
import { useToast } from '../contexts/ToastContext';

export interface TestStep {
  id: number;
  step_order: number;
  action: string;
  selector?: string;
  value?: string;
  attr?: string;
  description?: string;
}

export interface TestStepEditorProps {
  step: TestStep;
  onSave: (step: TestStep) => void;
  onDelete: (stepId: number) => void;
  onCancel: () => void;
  isOpen: boolean;
  testids?: Array<{ testid: string; tag: string; text: string }>;
}

const ACTIONS = [
  { value: 'click', label: 'Click' },
  { value: 'expectText', label: 'Expect Text' },
  { value: 'expectAttr', label: 'Expect Attribute' },
  { value: 'expectUrlContains', label: 'Expect URL Contains' },
  { value: 'expectPageTitle', label: 'Expect Page Title' },
  { value: 'waitForSelector', label: 'Wait For Selector' },
  { value: 'waitForPageLoad', label: 'Wait For Page Load' },
  { value: 'fill', label: 'Fill Input' },
];

const TestStepEditor: React.FC<TestStepEditorProps> = ({ step, onSave, onDelete, onCancel, isOpen, testids = [] }) => {
  const { showError } = useToast();
  const [form, setForm] = useState({
    step_order: step.step_order,
    action: step.action,
    selector: step.selector || '',
    value: step.value || '',
    attr: step.attr || '',
    description: step.description || '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectorType, setSelectorType] = useState<'data-testid' | 'custom'>('data-testid');

  useEffect(() => {
    setForm({
      step_order: step.step_order,
      action: step.action,
      selector: step.selector || '',
      value: step.value || '',
      attr: step.attr || '',
      description: step.description || '',
    });
    
    // Determine selector type based on current selector
    if (step.selector && step.selector.startsWith('[') || step.selector?.includes('.')) {
      setSelectorType('custom');
    } else {
      setSelectorType('data-testid');
    }
  }, [step]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedStep = {
        ...step,
        step_order: Number(form.step_order),
        action: form.action,
        selector: form.selector || undefined,
        value: form.value || undefined,
        attr: form.attr || undefined,
        description: form.description || undefined,
      };
      onSave(updatedStep);
    } catch (e) {
      showError('Failed to save step');
    }
  };

  const handleDelete = () => {
    onDelete(step.id);
    setShowDeleteConfirm(false);
  };

  const handleSelectorTypeChange = (type: 'data-testid' | 'custom') => {
    setSelectorType(type);
    setForm(f => ({ ...f, selector: '' })); // Clear selector when switching types
  };

  const handleTestidSelect = (testid: string) => {
    setForm(f => ({ ...f, selector: testid }));
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onCancel} title="Edit Test Step" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <FormField 
            label="Step Order" 
            type="text" 
            value={String(form.step_order)} 
            onChange={e => setForm(f => ({ ...f, step_order: e.target.value }))} 
            required 
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
                  name="selectorType"
                  value="data-testid"
                  checked={selectorType === 'data-testid'}
                  onChange={() => handleSelectorTypeChange('data-testid')}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">data-testid</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="selectorType"
                  value="custom"
                  checked={selectorType === 'custom'}
                  onChange={() => handleSelectorTypeChange('custom')}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Custom CSS</span>
              </label>
            </div>
          </div>

          {/* Selector Field */}
          {selectorType === 'data-testid' ? (
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

          {(form.action === 'expectText' || form.action === 'expectAttr' || form.action === 'expectUrlContains' || form.action === 'expectPageTitle' || form.action === 'fill') && (
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

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Delete Step
            </button>
            <div className="flex gap-2">
              <button 
                type="button" 
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" 
                onClick={onCancel}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">Are you sure you want to delete this test step?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TestStepEditor; 