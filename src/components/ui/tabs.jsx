import React from 'react';

export const Tabs = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="flex space-x-4">
      {React.Children.map(children, (child, index) => {
        return React.cloneElement(child, {
          isActive: activeTab === index,
          onClick: () => setActiveTab(index),
        });
      })}
    </div>
  );
};

export const Tab = ({ children, isActive, onClick }) => {
  return (
    <button
      className={`px-4 py-2 rounded-md ${isActive ? 'bg-black text-white' : 'bg-gray-200'}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
