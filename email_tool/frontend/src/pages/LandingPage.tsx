import React, { useEffect, useState } from 'react';
import { useCustomer } from '../contexts/CustomerContext';
import { apiUrl } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';

const LandingPage: React.FC = () => {
  const { setSelectedCustomer } = useCustomer();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    fetchCustomers();
    // Add fade-in animation after a short delay
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
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

  const formatLastUsed = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-dark to-brand-panel text-[#f4f4f4] flex flex-col items-center justify-center p-8">
      <div className={`max-w-xl w-full rounded-2xl shadow-xl bg-brand-panel border border-brand-dark p-10 text-center animate-fade-in ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-center mb-6">
          <svg className="w-14 h-14 text-brand-accent mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          <span className="text-3xl font-extrabold tracking-tight">1973 Email Tool</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Welcome to the Email Campaign Tool</h1>
        <p className="text-gray-400 mb-8">
          Data-driven, automated, and measurable email marketing for modern brands.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              {customers.length > 0 && (
                <button 
                  onClick={() => setShowNew(false)}
                  className="bg-brand-accent hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold shadow transition text-white"
                >
                  Select a Customer
                </button>
              )}
              <button 
                onClick={() => setShowNew(true)}
                className="bg-brand-dark hover:bg-brand-panel px-6 py-3 rounded-xl font-semibold border border-brand-accent text-brand-accent transition"
              >
                + New Customer
              </button>
            </>
          )}
        </div>

        {showNew && (
          <div className="mb-8 p-6 bg-[#23272a] rounded-xl border border-brand-dark">
            <h3 className="text-lg font-semibold mb-4">Create New Customer</h3>
            <form onSubmit={createCustomer} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Customer name"
                className="flex-1 px-4 py-2 bg-brand-dark border border-brand-panel rounded-lg text-[#f4f4f4] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                required
                autoFocus
              />
              <div className="flex gap-2">
                <button 
                  type="submit" 
                  disabled={creating} 
                  className="px-6 py-2 bg-brand-accent hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowNew(false)} 
                  className="px-6 py-2 bg-brand-panel hover:bg-brand-dark text-[#f4f4f4] rounded-lg font-medium border border-brand-accent transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {!showNew && customers.length > 0 && (
          <div className="mt-10 border-t border-brand-dark pt-6 text-left">
            <h3 className="text-lg font-semibold mb-3">Recently Used</h3>
            <ul className="text-gray-300 space-y-2">
              {customers.slice(0, 3).map(customer => (
                <li key={customer.id} className="flex items-center justify-between">
                  <button
                    onClick={() => handleSelect(customer)}
                    className="text-left hover:text-white transition-colors duration-200"
                  >
                    • {customer.name}
                  </button>
                  <span className="text-sm text-gray-500">
                    — Last used {formatLastUsed(customer.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage; 