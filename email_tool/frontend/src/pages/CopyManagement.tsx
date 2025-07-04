import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import PlaceholderBadge from '../components/PlaceholderBadge';
import { apiUrl } from '../config';
import { useToast } from '../contexts/ToastContext';

interface CopyEntry {
  id: number;
  campaign_id: number;
  language: string;
  key: string;
  value: string;
  created_at: string;
}

interface Campaign {
  id: number;
  name: string;
  templates_count: number;
  languages_count: number;
}

interface Template {
  id: number;
  campaign_id: number;
  filename: string;
  placeholders: string[];
}

interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
}

const CopyManagement: React.FC = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const [copyEntries, setCopyEntries] = useState<CopyEntry[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [copyValue, setCopyValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newEntry, setNewEntry] = useState({
    language: '',
    key: '',
    value: ''
  });
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleteTimeout, setDeleteTimeout] = useState<NodeJS.Timeout | null>(null);

  const languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch campaigns
      const campaignsResponse = await fetch(apiUrl('/campaigns'));
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json();
        setCampaigns(campaignsData);
      }

      // Fetch templates
      const templatesResponse = await fetch(apiUrl('/templates'));
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData);
      }

      // Fetch tags
      const tagsResponse = await fetch(apiUrl('/tags'));
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        setTags(tagsData);
      }

      // TODO: Fetch copy entries when backend endpoint is available
      // For now, we'll use empty array
      setCopyEntries([]);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignChange = (campaignId: string) => {
    setSelectedCampaign(campaignId);
    setSelectedTag('');
  };

  const getAvailableTags = () => {
    // Return all tags for now - in a real implementation, you might want to filter by campaign
    return tags;
  };

  const addCopyEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !newEntry.language || !newEntry.key || !newEntry.value) return;
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('key', newEntry.key);
      formData.append('value', newEntry.value);

      const response = await fetch(apiUrl(`/copy/${selectedCampaign}/${newEntry.language}`), {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setCopyEntries(prev => [...prev, result]);
        setNewEntry({ language: '', key: '', value: '' });
                 setSelectedCampaign('');
        setSelectedLanguage('');
        setSelectedTag('');
        setShowAddForm(false);
        showSuccess('Copy Added', 'Copy entry has been added successfully.');
      } else {
        throw new Error('Failed to add copy entry');
      }
    } catch (error) {
      console.error('Error adding copy entry:', error);
      showError('Addition Failed', 'Failed to add copy entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCopyEntry = async (id: number) => {
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
      const entry = copyEntries.find(e => e.id === id);
      if (!entry) return;
      const response = await fetch(apiUrl(`/copy/${selectedCampaign}/${entry.language}/${entry.key}`), {
        method: 'DELETE',
      });
      if (response.ok) {
        setCopyEntries(prev => prev.filter(entry => entry.id !== id));
        showSuccess('Copy Deleted', 'Copy entry has been deleted successfully.');
      } else {
        showError('Deletion Failed', 'Failed to delete copy entry. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting copy entry:', error);
      showError('Deletion Failed', 'Failed to delete copy entry. Please try again.');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Copy Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage localized copy for your email campaigns.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Copy
        </button>
      </div>

      <Modal title="Add Copy Entry" isOpen={showAddForm} onClose={() => setShowAddForm(false)}>
        <form onSubmit={addCopyEntry}>
          <FormField
            label="Campaign"
            type="select"
            value={selectedCampaign}
            onChange={(e) => handleCampaignChange(e.target.value)}
            options={campaigns.map(c => ({ value: c.id.toString(), label: c.name }))}
            required
          />
          <FormField
            label="Language"
            type="select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            options={languages.map(l => ({ value: l, label: getLanguageName(l) }))}
            required
          />
          <FormField
            label="Tag"
            type="select"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            options={getAvailableTags().map(tag => ({ value: tag.name, label: tag.name }))}
            required
          />
          <FormField
            label="Copy Value"
            type="textarea"
            value={copyValue}
            onChange={(e) => setCopyValue(e.target.value)}
            placeholder="Enter the localized copy text"
            required
          />
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {copyEntries.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No copy entries</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding localized copy for your campaigns.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {copyEntries.map((entry) => (
              <li key={entry.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {campaigns.find(c => c.id === entry.campaign_id)?.name || 'Unknown Campaign'}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{getLanguageName(entry.language)}</span>
                        </div>
                        <div className="mt-1">
                          <PlaceholderBadge 
                            value={entry.key} 
                            isTag={true}
                            color={tags.find(t => t.name === entry.key)?.color}
                          />
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-md">
                          {entry.value}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Added {new Date(entry.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">Edit</button>
                      <button
                        onClick={() => deleteCopyEntry(entry.id)}
                        disabled={pendingDeleteId !== null && pendingDeleteId !== entry.id}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                      >
                        {pendingDeleteId === entry.id ? 'Confirm Delete' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CopyManagement; 