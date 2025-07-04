import React from 'react';

const LoadingSpinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

export default LoadingSpinner; 