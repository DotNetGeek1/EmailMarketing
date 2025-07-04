import React from 'react';

interface PlaceholderBadgeProps {
  value: string;
  color?: string;
  isTag?: boolean;
}

const PlaceholderBadge: React.FC<PlaceholderBadgeProps> = ({ value, color, isTag = false }) => {
  if (isTag && color) {
    return (
      <span 
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-1 mb-1 text-white"
        style={{ backgroundColor: color }}
      >
        {value}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mr-1 mb-1">
      {value}
    </span>
  );
};

export default PlaceholderBadge; 