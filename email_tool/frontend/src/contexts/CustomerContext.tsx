import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Customer {
  id: number;
  name: string;
  created_at: string;
}

interface CustomerContextType {
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer) => void;
  clearCustomer: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) throw new Error('useCustomer must be used within a CustomerProvider');
  return context;
};

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const clearCustomer = () => setSelectedCustomer(null);

  return (
    <CustomerContext.Provider value={{ selectedCustomer, setSelectedCustomer, clearCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
}; 