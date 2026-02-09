import React from 'react';

const Input = ({
  label,
  error,
  className = '',
  ...props
}) => {
  const baseClasses = 'px-4 py-3 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-white/20 block w-full transition-all duration-300 bg-white/5 text-white placeholder-white/20 outline-none backdrop-blur-sm';
  const errorClasses = error ? 'border-red-500/50 focus:ring-red-500/30' : '';

  const inputClasses = `${baseClasses} ${errorClasses} ${className}`;

  return (
    <div className="flex flex-col space-y-2">
      {label && (
        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && (
        <p className="text-red-400 text-[10px] font-black uppercase tracking-widest pl-1">{error}</p>
      )}
    </div>
  );
};

export default Input;