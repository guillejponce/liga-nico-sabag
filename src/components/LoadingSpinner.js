import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'green' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const colorClasses = {
    green: 'border-green-500',
    blue: 'border-blue-500',
    red: 'border-red-500',
    yellow: 'border-yellow-500',
    gray: 'border-gray-500',
    white: 'border-white'
  };

  return (
    <div className="flex justify-center items-center">
      <div 
        className={`
          animate-spin rounded-full 
          border-t-2 border-b-2 
          ${sizeClasses[size] || sizeClasses.md}
          ${colorClasses[color] || colorClasses.green}
        `}
      />
    </div>
  );
};

export default LoadingSpinner; 