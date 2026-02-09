import React from 'react';

const Input = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-500 tracking-tight block pl-0.5"
        >
          {label}
        </label>
      )}
      <div className="relative group/input">
        <input
          id={id}
          className={`
            w-full transition-all duration-200 bg-white border border-slate-200
            rounded-lg h-10 px-3 text-slate-900 text-sm outline-none
            placeholder:text-slate-400
            focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10
            disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale
            ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-red-400 text-xs font-medium pl-0.5 animate-fade-in">{error}</p>
      )}
    </div>
  );
};

export default Input;