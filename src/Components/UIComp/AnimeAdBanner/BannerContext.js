import React, {createContext, useState, useContext, useEffect} from 'react';
import {useFeatureFlag} from 'configcat-react';
import {Platform} from 'react-native';
import {isMacOS} from '../../../Utils/PlatformUtils';

let getVersion;
try {
  if (!isMacOS) {
    getVersion = require('react-native-device-info').getVersion;
  }
} catch (error) {
  console.log('react-native-device-info not available on this platform');
}

// Create the context
const BannerContext = createContext();

// Provider component
export const BannerProvider = ({children}) => {
  const [bannerStates, setBannerStates] = useState({
    animeBanner: true,
  });
  const {value: forIosValue} = useFeatureFlag('forIos', 'Default');

  useEffect(() => {
    if (isMacOS || !getVersion) {
      // On macOS, just show banner by default
      setBannerStates(prevState => ({
        ...prevState,
        animeBanner: true,
      }));
      return;
    }

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
