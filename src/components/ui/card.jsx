import React from 'react';

export const Card = ({ children, className }) => {
  return (
    <div className={`p-4 bg-white shadow-md rounded-md ${className}`}>
      {children}
    </div>
  );
};

export const CardContent = ({ children }) => {
  return <div className="text-gray-700">{children}</div>;
};
