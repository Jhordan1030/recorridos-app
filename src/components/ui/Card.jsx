import React from 'react';

const Card = ({
  children,
  className = '',
  padding = 'p-6',
  hover = false,
  variant = 'base',
  ...props
}) => {
  const baseClasses = 'transition-all duration-200 border rounded-xl overflow-hidden';

  const variants = {
    base: 'bg-white border-slate-200 shadow-sm',
    raised: 'bg-white border-slate-200 shadow-md',
    subtle: 'bg-slate-50 border-slate-100 shadow-none'
  };

  const hoverClasses = hover ? 'hover:border-primary-200 hover:shadow-md hover:-translate-y-0.5' : '';
  const classes = `${baseClasses} ${variants[variant]} ${padding} ${hoverClasses} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-6 pt-4 border-t border-slate-100 ${className}`}>
    {children}
  </div>
);

export default Card;