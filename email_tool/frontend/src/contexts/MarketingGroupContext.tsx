import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { apiUrl } from '../config';
import { MarketingGroup } from './ProjectContext';

export interface MarketingGroupType {
  id: number;
  label: string;
  code: string;
}

interface MarketingGroupContextType {
  marketingGroups: MarketingGroup[];
  marketingGroupTypes: MarketingGroupType[];
  setMarketingGroups: React.Dispatch<React.SetStateAction<MarketingGroup[]>>;
  fetchMarketingGroups: (projectId?: number) => Promise<void>;
  fetchMarketingGroupTypes: () => Promise<void>;
  createMarketingGroup: (projectId: number, marketingGroupTypeId: number) => Promise<MarketingGroup | null>;
  deleteMarketingGroup: (groupId: number) => Promise<boolean>;
}

const MarketingGroupContext = createContext<MarketingGroupContextType | undefined>(undefined);

export const useMarketingGroup = () => {
  const context = useContext(MarketingGroupContext);
  if (context === undefined) {
    throw new Error('useMarketingGroup must be used within a MarketingGroupProvider');
  }
  return context;
};

interface MarketingGroupProviderProps {
  children: ReactNode;
}

export const MarketingGroupProvider: React.FC<MarketingGroupProviderProps> = ({ children }) => {
  const [marketingGroups, setMarketingGroups] = useState<MarketingGroup[]>([]);
  const [marketingGroupTypes, setMarketingGroupTypes] = useState<MarketingGroupType[]>([]);

  const fetchMarketingGroups = useCallback(async (projectId?: number) => {
    try {
      const url = projectId 
        ? apiUrl(`/marketing-groups?project_id=${projectId}`)
        : apiUrl('/marketing-groups');
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMarketingGroups(data);
      }
    } catch (error) {
      console.error('Error fetching marketing groups:', error);
    }
  }, []);

  const fetchMarketingGroupTypes = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/marketing-group-types'));
      if (response.ok) {
        const data = await response.json();
        setMarketingGroupTypes(data);
      }
    } catch (error) {
      console.error('Error fetching marketing group types:', error);
    }
  }, []);

  const createMarketingGroup = useCallback(async (projectId: number, marketingGroupTypeId: number): Promise<MarketingGroup | null> => {
    try {
      const formData = new FormData();
      formData.append('project_id', projectId.toString());
      formData.append('marketing_group_type_id', marketingGroupTypeId.toString());
      
      const response = await fetch(apiUrl('/marketing-groups'), {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const newGroup = await response.json();
        setMarketingGroups(prev => [...prev, newGroup]);
        return newGroup;
      }
      return null;
    } catch (error) {
      console.error('Error creating marketing group:', error);
      return null;
    }
  }, []);

  const deleteMarketingGroup = useCallback(async (groupId: number): Promise<boolean> => {
    try {
      const response = await fetch(apiUrl(`/marketing-groups/${groupId}`), {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setMarketingGroups(prev => prev.filter(group => group.id !== groupId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting marketing group:', error);
      return false;
    }
  }, []);

  const value: MarketingGroupContextType = {
    marketingGroups,
    marketingGroupTypes,
    setMarketingGroups,
    fetchMarketingGroups,
    fetchMarketingGroupTypes,
    createMarketingGroup,
    deleteMarketingGroup,
  };

  return (
    <MarketingGroupContext.Provider value={value}>
      {children}
    </MarketingGroupContext.Provider>
  );
}; 