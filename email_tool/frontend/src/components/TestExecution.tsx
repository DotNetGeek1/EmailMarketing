import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { apiUrl } from '../config';
import { useToast } from '../contexts/ToastContext';

export interface TestResult {
  id: number;
  status: 'passed' | 'failed' | 'error';
  execution_time: string;
  duration_ms: number;
  error_message?: string;
  screenshot_path?: string;
  logs?: string;
}

export interface TestExecutionProps {
  scenarioId: number;
  onResultUpdate?: () => void;
}

const TestExecution: React.FC<TestExecutionProps> = ({ scenarioId, onResultUpdate }) => {
  const { showSuccess, showError } = useToast();
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<number | null>(null);

  useEffect(() => {
    fetchResults();
  }, [scenarioId]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/test-builder/scenario/${scenarioId}`));
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      showError('Failed to load test results');
    } finally {
      setLoading(false);
    }
  };

  const runTest = async () => {
    setRunning(true);
    try {
      const res = await fetch(apiUrl(`/test-builder/scenario/${scenarioId}/run`), { method: 'POST' });
      const result = await res.json();
      if (res.ok) {
        showSuccess('Test completed', `Status: ${result.status}`);
        await fetchResults();
        onResultUpdate?.();
      } else {
        showError('Test failed', result.detail || 'Unknown error');
      }
    } catch (e) {
      showError('Failed to run test');
    } finally {
      setRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'error': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const latestResult = results[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Test Execution</h3>
        <button
          onClick={runTest}
          disabled={running}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          {running ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Running...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Run Test
            </>
          )}
        </button>
      </div>

      {latestResult && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(latestResult.status)}`}>
                {latestResult.status.toUpperCase()}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(latestResult.execution_time).toLocaleString()}
              </span>
              <span className="text-sm text-gray-400">
                {latestResult.duration_ms}ms
              </span>
            </div>
          </div>

          {latestResult.error_message && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Error:</div>
              <div className="text-sm text-red-700 dark:text-red-300 font-mono">{latestResult.error_message}</div>
            </div>
          )}

          {latestResult.screenshot_path && (
            <div className="mb-3">
              <div className="text-sm font-medium mb-1">Screenshot:</div>
              <a
                href={latestResult.screenshot_path.replace('email_tool/backend', '')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                View Screenshot
              </a>
            </div>
          )}

          {latestResult.logs && (
            <div>
              <button
                onClick={() => setExpandedLogs(expandedLogs === latestResult.id ? null : latestResult.id)}
                className="text-sm text-blue-600 hover:underline mb-2"
              >
                {expandedLogs === latestResult.id ? 'Hide' : 'Show'} Logs
              </button>
              {expandedLogs === latestResult.id && (
                <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                  {latestResult.logs}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {results.length > 1 && (
        <div>
          <h4 className="font-medium mb-2">Test History</h4>
          <div className="space-y-2">
            {results.slice(1).map((result) => (
              <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(result.execution_time).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {result.duration_ms}ms
                  </span>
                </div>
                {result.screenshot_path && (
                  <a
                    href={result.screenshot_path.replace('email_tool/backend', '')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs"
                  >
                    Screenshot
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestExecution; 