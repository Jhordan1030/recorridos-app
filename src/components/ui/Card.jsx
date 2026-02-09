import React from 'react';

const Card = ({
  children,
  className = '',
  padding = 'p-6',
  hover = false,
  ...props
}) => {
  const baseClasses = 'backdrop-blur-xl border border-white/10 rounded-2xl transition-all duration-300';
  const glassClass = className.includes('bg-') ? '' : 'bg-white/5';
  const hoverClass = hover ? 'hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2' : '';
  const classes = `${baseClasses} ${glassClass} ${padding} ${hoverClass} ${className}`;

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
  <div className={`mt-6 pt-4 border-t border-white/5 ${className}`}>
    {children}
  </div>
);

export default Card;