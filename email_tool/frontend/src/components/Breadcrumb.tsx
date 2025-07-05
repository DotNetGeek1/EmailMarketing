import React from 'react';
import { BreadcrumbItem } from '../types/navigation';

import { Page } from '../types/navigation';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (page: Page, params?: Record<string, any>) => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onNavigate }) => {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg className="w-4 h-4 text-gray-400 mx-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {item.page ? (
              <button
                onClick={() => onNavigate(item.page!, item.params)}
                className={`text-sm font-medium transition-colors ${
                  index === items.length - 1
                    ? 'text-brand-text cursor-default'
                    : 'text-gray-500 hover:text-brand-text cursor-pointer'
                }`}
                disabled={index === items.length - 1}
              >
                {item.label}
              </button>
            ) : (
              <span className="text-sm font-medium text-brand-text">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb; 