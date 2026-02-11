// components/ui/Button.jsx
import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon = null,
  ...props
}) => {
  const baseClasses = 'relative inline-flex items-center justify-center font-semibold transition-all duration-200 border rounded-lg outline-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:grayscale group';

  const variants = {
    primary: 'bg-primary-600 text-white border-primary-500/50 hover:bg-primary-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.4)]',
    secondary: 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20 shadow-ent-sm',
    danger: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40',
    warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40'
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs tracking-tight',
    md: 'h-10 px-4 text-sm tracking-tight',
    lg: 'h-12 px-6 text-base tracking-tight'
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="opacity-90 text-[11px] font-bold uppercase tracking-widest">Cargando...</span>
        </span>
      ) : (
        <span className="flex items-center justify-center">
          {icon && <span className="mr-2 opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>}
          {children}
        </span>
      )}
    </button>
  );
};

export default Button;