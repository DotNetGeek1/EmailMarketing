import React, { useEffect, useState } from 'react';
import { useCustomer } from '../contexts/CustomerContext';
import { apiUrl } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';

const CustomerSelector: React.FC = () => {
  const { setSelectedCustomer } = useCustomer();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl('/customers'));
      if (response.ok) {
        setCustomers(await response.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (customer: any) => {
    setSelectedCustomer(customer);
  };

  const createCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const response = await fetch(apiUrl('/customer'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `name=${encodeURIComponent(newName)}`,
      });
      if (response.ok) {
        const newCustomer = await response.json();
        setCustomers(prev => [newCustomer, ...prev]);
        setSelectedCustomer(newCustomer);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-20 bg-white dark:bg-gray-800 shadow rounded-lg p-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Select a Customer</h1>
      {loading ? <LoadingSpinner /> : (
        <>
          <ul className="space-y-2 mb-6">
            {customers.map(c => (
              <li key={c.id}>
                <button
                  className="w-full text-left px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-600 text-gray-900 dark:text-white"
                  onClick={() => handleSelect(c)}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
          {showNew ? (
            <form onSubmit={createCustomer} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Customer name"
                className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900 flex-1"
                required
              />
              <button type="submit" disabled={creating} className="px-4 py-1 bg-blue-600 text-white rounded">
                {creating ? 'Creating...' : 'Add'}
              </button>
              <button type="button" onClick={() => setShowNew(false)} className="px-4 py-1 bg-gray-200 dark:bg-gray-700 rounded">Cancel</button>
            </form>
          ) : (
            <button onClick={() => setShowNew(true)} className="text-blue-600 hover:underline">+ New Customer</button>
          )}
        </>
      )}
    </div>
  );
};

export default CustomerSelector; 