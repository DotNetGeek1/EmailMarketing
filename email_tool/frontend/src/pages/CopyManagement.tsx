import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';
import PlaceholderBadge from '../components/PlaceholderBadge';

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
}

interface Template {
  id: number;
  campaign_id: number;
  placeholders: string[];
}

const CopyManagement: React.FC = () => {
  const [copyEntries, setCopyEntries] = useState<CopyEntry[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [copyValue, setCopyValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'];

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
        setTemplates([
          { id: 1, campaign_id: 1, placeholders: ['{{headline}}', '{{description}}', '{{cta_text}}'] },
          { id: 2, campaign_id: 2, placeholders: ['{{title}}', '{{content}}', '{{cta_url}}', '{{cta_text}}'] },
        ]);
        setCopyEntries([
          { id: 1, campaign_id: 1, language: 'en', key: '{{headline}}', value: 'Summer Sale - Up to 50% Off!', created_at: '2024-01-15' },
          { id: 2, campaign_id: 1, language: 'en', key: '{{description}}', value: 'Don\'t miss our biggest sale of the year!', created_at: '2024-01-15' },
          { id: 3, campaign_id: 1, language: 'es', key: '{{headline}}', value: 'Venta de Verano - ¡Hasta 50% de Descuento!', created_at: '2024-01-15' },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleCampaignChange = (campaignId: string) => {
    setSelectedCampaign(campaignId);
    setSelectedKey('');
  };

  const getAvailablePlaceholders = () => {
    if (!selectedCampaign) return [];
    const campaignTemplates = templates.filter(t => t.campaign_id === parseInt(selectedCampaign));
    return campaignTemplates.flatMap(t => t.placeholders);
  };

  const addCopyEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !selectedLanguage || !selectedKey || !copyValue.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/copy/${selectedCampaign}/${selectedLanguage}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `key=${encodeURIComponent(selectedKey)}&value=${encodeURIComponent(copyValue)}`,
      });

      if (response.ok) {
        const result = await response.json();
        const newEntry: CopyEntry = {
          id: result.id,
          campaign_id: parseInt(selectedCampaign),
          language: selectedLanguage,
          key: selectedKey,
          value: copyValue,
          created_at: new Date().toISOString().split('T')[0],
        };
        setCopyEntries(prev => [newEntry, ...prev]);
        setSelectedCampaign('');
        setSelectedLanguage('');
        setSelectedKey('');
        setCopyValue('');
        setShowAddForm(false);
      } else {
        throw new Error('Failed to add copy entry');
      }
    } catch (error) {
      alert('Failed to add copy entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCopyEntry = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this copy entry?')) return;
    setCopyEntries(prev => prev.filter(entry => entry.id !== id));
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
          <h1 className="text-2xl font-bold text-gray-900">Copy Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage localized copy for your email campaigns.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
            label="Placeholder Key"
            type="select"
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            options={getAvailablePlaceholders().map(p => ({ value: p, label: p }))}
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
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {submitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {copyEntries.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No copy entries</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding localized copy for your campaigns.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {copyEntries.map((entry) => (
              <li key={entry.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {campaigns.find(c => c.id === entry.campaign_id)?.name || 'Unknown Campaign'}
                          </span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{getLanguageName(entry.language)}</span>
                        </div>
                        <div className="mt-1">
                          <PlaceholderBadge value={entry.key} />
                        </div>
                        <div className="text-sm text-gray-600 mt-2 max-w-md">
                          {entry.value}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Added {new Date(entry.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-sm text-gray-600 hover:text-gray-800">Edit</button>
                      <button
                        onClick={() => deleteCopyEntry(entry.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
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