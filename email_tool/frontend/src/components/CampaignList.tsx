import React from 'react';

export interface Campaign {
  id: number;
  name: string;
  created_at: string;
  templates_count?: number;
  languages_count?: number;
}

interface CampaignListProps {
  campaigns: Campaign[];
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const CampaignList: React.FC<CampaignListProps> = ({ campaigns, onView, onEdit, onDelete }) => {
  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new campaign.</p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-gray-200">
      {campaigns.map((campaign) => (
        <li key={campaign.id}>
          <div className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                  <div className="text-sm text-gray-500">
                    Created {new Date(campaign.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-4 mt-1">
                    <span className="text-xs text-gray-400">{campaign.templates_count || 0} templates</span>
                    <span className="text-xs text-gray-400">{campaign.languages_count || 0} languages</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {onView && (
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium" onClick={() => onView(campaign.id)}>
                    View
                  </button>
                )}
                {onEdit && (
                  <button className="text-sm text-gray-600 hover:text-gray-800" onClick={() => onEdit(campaign.id)}>
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button className="text-sm text-red-600 hover:text-red-800" onClick={() => onDelete(campaign.id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default CampaignList; 