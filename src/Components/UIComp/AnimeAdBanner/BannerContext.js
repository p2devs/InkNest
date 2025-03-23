import React, {createContext, useState, useContext, useEffect} from 'react';
import {useFeatureFlag} from 'configcat-react';
import {getVersion} from 'react-native-device-info';

// Create the context
const BannerContext = createContext();

// Provider component
export const BannerProvider = ({children}) => {
  const [bannerStates, setBannerStates] = useState({
    animeBanner: true,
  });
  const {value: forIosValue} = useFeatureFlag('forIos', 'Default');

  useEffect(() => {
    if (forIosValue !== getVersion()) {
      setBannerStates(prevState => ({
        ...prevState,
        animeBanner: true,
      }));
    } else {
      setBannerStates(prevState => ({
        ...prevState,
        animeBanner: false,
      }));
    }
  }, [forIosValue]);

  // Function to update banner visibility
  const updateBannerVisibility = (bannerKey, isVisible) => {
    setBannerStates(prevState => ({
      ...prevState,
      [bannerKey]: isVisible,
    }));
  };

  // Context value
  const value = {
    bannerStates,
    updateBannerVisibility,
  };

  return (
    <BannerContext.Provider value={value}>{children}</BannerContext.Provider>
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
