import React, { createContext, useState, useContext } from 'react';

// Create the context
const BannerContext = createContext();

// Provider component
export const BannerProvider = ({ children }) => {
  const [bannerStates, setBannerStates] = useState({
    animeBanner: true
  });

  // Function to update banner visibility
  const updateBannerVisibility = (bannerKey, isVisible) => {
    setBannerStates(prevState => ({
      ...prevState,
      [bannerKey]: isVisible
    }));
  };

  // Context value
  const value = {
    bannerStates,
    updateBannerVisibility
  };

  return (
    <BannerContext.Provider value={value}>
      {children}
    </BannerContext.Provider>
  );
};

// Custom hook for easier context consumption
export const useBannerContext = () => {
  const context = useContext(BannerContext);
  if (context === undefined) {
    throw new Error('useBannerContext must be used within a BannerProvider');
  }
  return context;
};