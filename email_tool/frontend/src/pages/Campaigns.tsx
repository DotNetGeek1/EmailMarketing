import React, { useState, useEffect } from 'react';
import { useCampaign } from '../contexts/CampaignContext';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import CampaignList, { Campaign } from '../components/CampaignList';
import { apiUrl } from '../config';
import { useCustomer } from '../contexts/CustomerContext';

const Campaigns: React.FC = () => {
  const { setCurrentCampaign } = useCampaign();
  const { showSuccess, showError, showInfo } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleteTimeout, setDeleteTimeout] = useState<NodeJS.Timeout | null>(null);
  const [customers, setCustomers] = useState<{id: number, name: string}[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch(apiUrl('/customers'));
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      setCustomers([]);
    }
  };

  const createCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    setCreatingCustomer(true);
    try {
      const response = await fetch(apiUrl('/customer'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `name=${encodeURIComponent(newCustomerName)}`,
      });
      if (response.ok) {
        const newCustomer = await response.json();
        setCustomers(prev => [newCustomer, ...prev]);
        setSelectedCustomer(newCustomer.id);
        setShowNewCustomer(false);
        setNewCustomerName('');
        showSuccess('Customer Created', `${newCustomer.name} has been created.`);
      } else {
        throw new Error('Failed to create customer');
      }
    } catch (error) {
      showError('Creation Failed', 'Failed to create customer.');
    } finally {
      setCreatingCustomer(false);
    }
  };

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim() || !selectedCustomer) return;
    setCreating(true);
    try {
      const response = await fetch(apiUrl('/campaign'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `name=${encodeURIComponent(newCampaignName)}&customer_id=${selectedCustomer}`,
      });
      if (response.ok) {
        const newCampaign = await response.json();
        setCampaigns(prev => [newCampaign, ...prev]);
        setNewCampaignName('');
        setShowCreateForm(false);
        // Show success toast
        showSuccess('Campaign Created', `${newCampaign.name} has been created successfully.`);
        // Automatically open the new campaign
        openCampaign(newCampaign);
      } else {
        throw new Error('Failed to create campaign');
      }
    } catch (error) {
      showError('Creation Failed', 'Failed to create campaign. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const fetchCampaigns = async () => {
    if (!selectedCustomer) return;
    try {
      setLoading(true);
      const response = await fetch(apiUrl(`/campaigns?customer_id=${selectedCustomer}`));
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      } else {
        setCampaigns([]);
      }
    } catch (error) {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const openCampaign = (campaign: Campaign) => {
    setCurrentCampaign(campaign);
    // Navigate to campaign detail page
    window.history.pushState({}, '', `/campaign/${campaign.id}`);
    // Trigger a custom event to notify App.tsx to change the page
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'campaign-detail' }));
  };

  const deleteCampaign = async (id: number) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      showInfo('Confirm Delete', 'Click delete again to confirm.');
      if (deleteTimeout) clearTimeout(deleteTimeout);
      setDeleteTimeout(setTimeout(() => setPendingDeleteId(null), 5000));
      return;
    }
    setPendingDeleteId(null);
    if (deleteTimeout) clearTimeout(deleteTimeout);
    try {
      const response = await fetch(apiUrl(`/campaign/${id}`), {
        method: 'DELETE',
      });
      if (response.ok) {
        setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
        showSuccess('Campaign Deleted', 'Campaign has been deleted successfully.');
      } else {
        showError('Deletion Failed', 'Failed to delete campaign. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      showError('Deletion Failed', 'Failed to delete campaign. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your email campaigns and their associated templates.</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
            onChange={(e) => setNewCampaignName(e.target.value)}
            required
            placeholder="Enter campaign name"
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer</label>
            <div className="flex items-center gap-2">
              <select
                value={selectedCustomer || ''}
                onChange={e => setSelectedCustomer(Number(e.target.value))}
                required
                className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900"
              >
                <option value="" disabled>Select customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowNewCustomer(true)} className="text-xs text-blue-600 hover:underline">New Customer</button>
            </div>
            {showNewCustomer && (
              <form onSubmit={createCustomer} className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm bg-white dark:bg-gray-900"
                  required
                />
                <button type="submit" disabled={creatingCustomer} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">{creatingCustomer ? 'Creating...' : 'Add'}</button>
                <button type="button" onClick={() => setShowNewCustomer(false)} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded">Cancel</button>
              </form>
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
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
          onOpen={openCampaign}
        />
      )}
    </div>
  );
};

export default Campaigns; 