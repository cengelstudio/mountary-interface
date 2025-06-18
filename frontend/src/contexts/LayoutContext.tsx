import React, { createContext, useContext, ReactNode } from 'react';

interface LayoutContextType {
  contentWidth: string;
  contentPadding: string;
}

const LayoutContext = createContext<LayoutContextType>({
  contentWidth: '1200px',
  contentPadding: '2rem',
});

export const useLayout = () => useContext(LayoutContext);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = {
    contentWidth: '1200px',
    contentPadding: '2rem',
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};
