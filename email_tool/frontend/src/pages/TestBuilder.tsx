import React, { useState } from 'react';
import TestScenarioList from '../components/TestScenarioList';
import TestScenarioDetail from '../components/TestScenarioDetail';

const TestBuilder: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Test Builder</h1>
      <div className="max-w-4xl mx-auto">
        {selectedScenarioId ? (
          <TestScenarioDetail scenarioId={selectedScenarioId} onBack={() => setSelectedScenarioId(null)} />
        ) : (
          <TestScenarioList onSelect={setSelectedScenarioId} selectedScenarioId={selectedScenarioId ?? undefined} />
        )}
      </div>
    </div>
  );
};

export default TestBuilder; 