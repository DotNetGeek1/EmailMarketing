import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import CampaignList, { Campaign } from '../components/CampaignList';

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        setCampaigns([
          { id: 1, name: 'Summer Sale 2024', created_at: '2024-01-15', templates_count: 2, languages_count: 5 },
          { id: 2, name: 'Product Launch', created_at: '2024-01-10', templates_count: 1, languages_count: 3 },
          { id: 3, name: 'Newsletter Q1', created_at: '2024-01-05', templates_count: 3, languages_count: 8 },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      setLoading(false);
    }
  };

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;
    setCreating(true);
    try {
      const response = await fetch('/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `name=${encodeURIComponent(newCampaignName)}`,
      });
      if (response.ok) {
        const newCampaign = await response.json();
        setCampaigns(prev => [newCampaign, ...prev]);
        setNewCampaignName('');
        setShowCreateForm(false);
      } else {
        throw new Error('Failed to create campaign');
      }
    } catch {
      alert('Failed to create campaign. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const deleteCampaign = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your email campaigns and their associated templates.</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Campaign
        </button>
      </div>

      <Modal title="Create New Campaign" isOpen={showCreateForm} onClose={() => setShowCreateForm(false)}>
        <form onSubmit={createCampaign}>
          <FormField
            label="Campaign Name"
            value={newCampaignName}
            onChange={e => setNewCampaignName(e.target.value)}
            required
            placeholder="Enter campaign name"
          />
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <CampaignList
          campaigns={campaigns}
          onDelete={deleteCampaign}
        />
      )}
    </div>
  );
};

export default Campaigns; 