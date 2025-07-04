import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { apiUrl } from '../config';
import { useCustomer } from './CustomerContext';

export interface Campaign {
  id: number;
  name: string;
  created_at: string;
  templates_count: number;
  languages_count: number;
  status?: string;
  tags?: Tag[];
}

export interface Template {
  id: number;
  campaign_id: number;
  filename: string;
  placeholders: string[];
  created_at: string;
}

export interface CopyEntry {
  id: number;
  campaign_id: number;
  language: string;
  key: string;
  value: string;
  created_at: string;
}

export interface GeneratedEmail {
  id: number;
  campaign_id: number;
  language: string;
  html_content: string;
  generated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
  created_at?: string;
  campaign_count?: number;
}

interface CampaignContextType {
  currentCampaign: Campaign | null;
  setCurrentCampaign: (campaign: Campaign | null) => void;
  updateCampaign: (campaign: Campaign) => void;
  templates: Template[];
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  copyEntries: CopyEntry[];
  setCopyEntries: React.Dispatch<React.SetStateAction<CopyEntry[]>>;
  generatedEmails: GeneratedEmail[];
  setGeneratedEmails: React.Dispatch<React.SetStateAction<GeneratedEmail[]>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refreshCampaignData: () => Promise<void>;
  updateCampaignTags: (tags: Tag[]) => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};

interface CampaignProviderProps {
  children: ReactNode;
}

export const CampaignProvider: React.FC<CampaignProviderProps> = ({ children }) => {
  const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [copyEntries, setCopyEntries] = useState<CopyEntry[]>([]);
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const { selectedCustomer } = useCustomer();

  const handleSetCurrentCampaign = useCallback((campaign: Campaign | null) => {
    // Clear existing data when switching campaigns
    setTemplates([]);
    setCopyEntries([]);
    setGeneratedEmails([]);
    setActiveTab('overview');
    
    // Ensure the campaign has the correct tags (or empty array if none)
    if (campaign) {
      const campaignWithTags = {
        ...campaign,
        tags: campaign.tags || []
      };
      setCurrentCampaign(campaignWithTags);
    } else {
      setCurrentCampaign(null);
    }
  }, []);

  const refreshCampaignData = useCallback(async () => {
    if (!currentCampaign || !selectedCustomer) return;
    try {
      // Fetch templates for this campaign
      const templatesResponse = await fetch(apiUrl(`/templates?campaign_id=${currentCampaign.id}&customer_id=${selectedCustomer.id}`));
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData);
      }
      // Fetch copy entries for this campaign
      const copyResponse = await fetch(apiUrl(`/copy/${currentCampaign.id}?customer_id=${selectedCustomer.id}`));
      if (copyResponse.ok) {
        const copyData = await copyResponse.json();
        setCopyEntries(copyData);
      }
      // Fetch generated emails for this campaign
      const emailsResponse = await fetch(apiUrl(`/emails/${currentCampaign.id}?customer_id=${selectedCustomer.id}`));
      if (emailsResponse.ok) {
        const emailsData = await emailsResponse.json();
        setGeneratedEmails(emailsData);
      }
    } catch (error) {
      console.error('Error refreshing campaign data:', error);
    }
  }, [currentCampaign, selectedCustomer]);

  const updateCampaignTags = useCallback((tags: Tag[]) => {
    if (currentCampaign) {
      const updatedCampaign = {
        ...currentCampaign,
        tags: tags
      };
      setCurrentCampaign(updatedCampaign);
    }
  }, [currentCampaign]);

  const updateCampaign = useCallback((campaign: Campaign) => {
    setCurrentCampaign(campaign);
  }, []);

  const value: CampaignContextType = {
    currentCampaign,
    setCurrentCampaign: handleSetCurrentCampaign,
    updateCampaign,
    templates,
    setTemplates,
    copyEntries,
    setCopyEntries,
    generatedEmails,
    setGeneratedEmails,
    activeTab,
    setActiveTab,
    refreshCampaignData,
    updateCampaignTags,
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}; 