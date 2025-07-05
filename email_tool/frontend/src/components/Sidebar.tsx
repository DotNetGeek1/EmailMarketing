import React from 'react';
import { Page } from '../types/navigation';

interface SidebarProps {
  isOpen: boolean;
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onClose: () => void;
}

const navigation: Array<{ name: string; page: Page; icon: string }> = [
  { name: 'Dashboard', page: 'dashboard', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
  { name: 'Projects', page: 'projects', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { name: 'Testing', page: 'testing', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Tag Management', page: 'tags', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { name: 'Test Builder', page: 'test-builder', icon: 'M12 4v16m8-8H4' },
  { name: 'Marketing Group Types', page: 'marketing-group-types', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentPage, onPageChange, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-brand-panel shadow-lg border-r border-brand-dark transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0">
        <div className="h-full flex flex-col p-4 text-[#f4f4f4]">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email Tool</h2>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  onPageChange(item.page);
                  onClose();
                }}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${currentPage === item.page
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-r-2 border-blue-700 dark:border-blue-500'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.name}
              </button>
            ))}
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Internal Email Marketing Tool
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 