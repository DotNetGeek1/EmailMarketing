import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiUrl } from '../config';
import { useToast } from '../contexts/ToastContext';

interface TestResult {
  id: number;
  project_id: number;
  locale: string;
  passed: boolean;
  issues: string[];
  tested_at: string;
  generated_email_id: number;
}

interface Project {
  id: number;
  name: string;
  templates_count: number;
  languages_count: number;
}

const Testing: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningTests, setRunningTests] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [showTestForm, setShowTestForm] = useState(false);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch projects
      const projectsResponse = await fetch(apiUrl('/projects'));
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      }

      // TODO: Fetch test results when backend endpoint is available
      // For now, we'll use empty array
      setTestResults([]);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runTests = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setRunningTests(true);
    try {
      const response = await fetch(apiUrl(`/test/${selectedProject}`), {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Tests Completed', `Successfully ran ${result.tested} tests!`);
        // In a real app, you'd fetch the updated test results
        // For now, we'll simulate new results
        const newResults: TestResult[] = [
          {
            id: Date.now(),
            project_id: parseInt(selectedProject),
            locale: 'en',
            passed: Math.random() > 0.3,
            issues: Math.random() > 0.3 ? [] : ['Sample issue for testing'],
            tested_at: new Date().toISOString(),
            generated_email_id: Date.now(),
          },
        ];
        setTestResults(prev => [...newResults, ...prev]);
        setSelectedProject('');
        setShowTestForm(false);
      } else {
        showError('Test Failed', 'Failed to run tests. Please try again.');
      }
    } catch (error) {
      console.error('Error running tests:', error);
      showError('Test Failed', 'Failed to run tests. Please try again.');
    } finally {
      setRunningTests(false);
    }
  };

  const getStatusIcon = (passed: boolean) => {
    if (passed) {
      return (
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
  };

  const getLanguageName = (code: string) => {
    const languageNames: { [key: string]: string } = {
      en: 'English', es: 'Spanish', fr: 'French', de: 'German',
      it: 'Italian', pt: 'Portuguese', ja: 'Japanese', ko: 'Korean', zh: 'Chinese'
    };
    return languageNames[code] || code;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Testing</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Run Playwright tests to validate your email templates.</p>
        </div>
        <button
          onClick={() => setShowTestForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Run Tests
        </button>
      </div>

      <Modal title="Run Tests" isOpen={showTestForm} onClose={() => setShowTestForm(false)}>
        <form onSubmit={runTests}>
          <FormField
            label="Project"
            type="select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            options={projects.map(p => ({ value: p.id.toString(), label: p.name }))}
            required
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            This will run Playwright tests to validate placeholder substitution, URLs, and email rendering.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowTestForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={runningTests}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
            >
              {runningTests ? 'Running...' : 'Run Tests'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {testResults.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No test results</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Run tests on your projects to see validation results.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {testResults.map((result) => (
              <li key={result.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(result.passed)}
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {projects.find(p => p.id === result.project_id)?.name || 'Unknown Project'}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{getLanguageName(result.locale)}</span>
                        </div>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.passed 
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}>
                            {result.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                        {result.issues.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Issues:</p>
                            <ul className="mt-1 space-y-1">
                              {result.issues.map((issue, index) => (
                                <li key={index} className="text-sm text-red-600 dark:text-red-400">• {issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Tested {new Date(result.tested_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setSelectedResult(result)}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Test Result Details Modal */}
      {selectedResult && (
        <Modal 
          title="Test Result Details" 
          isOpen={!!selectedResult} 
          onClose={() => setSelectedResult(null)}
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Project</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {projects.find(p => p.id === selectedResult.project_id)?.name || 'Unknown Project'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Locale</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">{getLanguageName(selectedResult.locale)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Status</h4>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                selectedResult.passed 
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}>
                {selectedResult.passed ? 'Passed' : 'Failed'}
              </span>
            </div>
            {selectedResult.issues.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Issues Found</h4>
                <ul className="mt-2 space-y-1">
                  {selectedResult.issues.map((issue, index) => (
                    <li key={index} className="text-sm text-red-600 dark:text-red-400">• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Tested At</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {new Date(selectedResult.tested_at).toLocaleString()}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Testing; 