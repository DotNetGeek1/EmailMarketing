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
}

const ACTIONS = [
  { value: 'click', label: 'Click' },
  { value: 'expectText', label: 'Expect Text' },
  { value: 'expectAttr', label: 'Expect Attribute' },
  { value: 'expectUrlContains', label: 'Expect URL Contains' },
  { value: 'waitForSelector', label: 'Wait For Selector' },
  { value: 'fill', label: 'Fill Input' },
];

const TestStepEditor: React.FC<TestStepEditorProps> = ({ step, onSave, onDelete, onCancel, isOpen }) => {
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

  useEffect(() => {
    setForm({
      step_order: step.step_order,
      action: step.action,
      selector: step.selector || '',
      value: step.value || '',
      attr: step.attr || '',
      description: step.description || '',
    });
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

  return (
    <>
      <Modal isOpen={isOpen} onClose={onCancel} title="Edit Test Step" size="lg">
        <form onSubmit={handleSave} className="space-y-3">
          <FormField label="Step Order" type="text" value={String(form.step_order)} onChange={e => setForm(f => ({ ...f, step_order: e.target.value }))} required />
          <FormField label="Action" type="select" value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))} required options={ACTIONS} />
          <FormField label="Selector (data-testid or CSS)" value={form.selector} onChange={e => setForm(f => ({ ...f, selector: e.target.value }))} placeholder="e.g. start-button or .my-class" />
          <FormField label="Value (for assertions/fill)" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} />
          <FormField label="Attribute (for expectAttr)" value={form.attr} onChange={e => setForm(f => ({ ...f, attr: e.target.value }))} placeholder="e.g. value, href" />
          <FormField label="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Delete Step
            </button>
            <div className="flex gap-2">
              <button type="button" className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Confirm Delete" size="sm">
        <div className="space-y-4">
          <p>Are you sure you want to delete this test step?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
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