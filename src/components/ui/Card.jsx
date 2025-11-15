import React from 'react';

const Card = ({ 
  children, 
  className = '',
  padding = 'p-6',
  hover = false,
  ...props 
}) => {
  const baseClasses = 'bg-white rounded-xl shadow-lg border border-gray-200';
  const hoverClass = hover ? 'hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1' : '';
  
  const classes = `${baseClasses} ${padding} ${hoverClass} ${className}`;

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
  <div className={`mt-6 pt-4 border-t border-gray-200 ${className}`}>
    {children}
  </div>
);

export default Card;