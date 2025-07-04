import React from 'react';

const PlaceholderBadge: React.FC<{ value: string }> = ({ value }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1">
    {value}
  </span>
);

export default PlaceholderBadge; 