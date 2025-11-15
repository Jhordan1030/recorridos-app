import React from 'react';

const Input = ({ 
  label,
  error,
  className = '',
  ...props 
}) => {
  const baseClasses = 'p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full transition-all duration-200 shadow-sm bg-white text-gray-900 placeholder-gray-500';
  const errorClasses = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '';
  
  const inputClasses = `${baseClasses} ${errorClasses} ${className}`;

  return (
    <div className="flex flex-col space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
};

export default Input;