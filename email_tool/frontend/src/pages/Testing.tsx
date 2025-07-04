import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';

interface TestResult {
  id: number;
  campaign_id: number;
  language: string;
  passed: boolean;
  issues: string[];
  tested_at: string;
  generated_email_id: number;
}

interface Campaign {
  id: number;
  name: string;
}

const Testing: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningTests, setRunningTests] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [showTestForm, setShowTestForm] = useState(false);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setTimeout(() => {
        setCampaigns([
          { id: 1, name: 'Summer Sale 2024' },
          { id: 2, name: 'Product Launch' },
          { id: 3, name: 'Newsletter Q1' },
        ]);
        setTestResults([
          {
            id: 1,
            campaign_id: 1,
            language: 'en',
            passed: true,
            issues: [],
            tested_at: '2024-01-15T10:30:00Z',
            generated_email_id: 1,
          },
          {
            id: 2,
            campaign_id: 1,
            language: 'es',
            passed: false,
            issues: ['Missing placeholder: {{cta_text}}', 'Broken link: https://example.com/sale'],
            tested_at: '2024-01-15T10:35:00Z',
            generated_email_id: 2,
          },
          {
            id: 3,
            campaign_id: 2,
            language: 'en',
            passed: true,
            issues: [],
            tested_at: '2024-01-14T15:20:00Z',
            generated_email_id: 3,
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      setLoading(false);
    }
  };

  const runTests = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    setRunningTests(true);
    try {
      const response = await fetch(`/test/${selectedCampaign}`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        // In a real app, you'd fetch the updated test results
        // For now, we'll simulate new results
        const newResults: TestResult[] = [
          {
            id: Date.now(),
            campaign_id: parseInt(selectedCampaign),
            language: 'en',
            passed: Math.random() > 0.3,
            issues: Math.random() > 0.3 ? [] : ['Sample issue for testing'],
            tested_at: new Date().toISOString(),
            generated_email_id: Date.now(),
          },
        ];
        setTestResults(prev => [...newResults, ...prev]);
        setSelectedCampaign('');
        setShowTestForm(false);
      } else {
        throw new Error('Failed to run tests');
      }
    } catch (error) {
      alert('Failed to run tests. Please try again.');
    } finally {
      setRunningTests(false);
    }
  };

  const getStatusIcon = (passed: boolean) => {
    if (passed) {
      return (
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <h1 className="text-2xl font-bold text-gray-900">Testing</h1>
          <p className="mt-1 text-sm text-gray-500">Run Playwright tests to validate your email templates.</p>
        </div>
        <button
          onClick={() => setShowTestForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
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
            label="Campaign"
            type="select"
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            options={campaigns.map(c => ({ value: c.id.toString(), label: c.name }))}
            required
          />
          <p className="text-sm text-gray-500 mb-4">
            This will run Playwright tests to validate placeholder substitution, URLs, and email rendering.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowTestForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={runningTests}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {runningTests ? 'Running...' : 'Run Tests'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {testResults.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No test results</h3>
            <p className="mt-1 text-sm text-gray-500">Run tests to validate your email templates.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {testResults.map((result) => (
              <li key={result.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(result.passed)}
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {campaigns.find(c => c.id === result.campaign_id)?.name || 'Unknown Campaign'}
                          </span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{getLanguageName(result.language)}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.passed 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {result.passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Tested {new Date(result.tested_at).toLocaleString()}
                        </div>
                        {result.issues.length > 0 && (
                          <div className="text-sm text-red-600 mt-1">
                            {result.issues.length} issue{result.issues.length !== 1 ? 's' : ''} found
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedResult(result)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
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

      <Modal 
        title={`Test Results: ${selectedResult ? campaigns.find(c => c.id === selectedResult.campaign_id)?.name : ''}`} 
        isOpen={!!selectedResult} 
        onClose={() => setSelectedResult(null)}
      >
        {selectedResult && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              {getStatusIcon(selectedResult.passed)}
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedResult.passed 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedResult.passed ? 'Passed' : 'Failed'}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  {getLanguageName(selectedResult.language)}
                </span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Test Details:</h4>
              <div className="text-sm text-gray-600">
                <p><strong>Campaign ID:</strong> {selectedResult.campaign_id}</p>
                <p><strong>Language:</strong> {selectedResult.language}</p>
                <p><strong>Tested At:</strong> {new Date(selectedResult.tested_at).toLocaleString()}</p>
                <p><strong>Generated Email ID:</strong> {selectedResult.generated_email_id}</p>
              </div>
            </div>

            {selectedResult.issues.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-700 mb-2">Issues Found:</h4>
                <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                  {selectedResult.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedResult.passed && (
              <div className="text-sm text-green-600">
                ✓ All tests passed successfully!
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Testing; 