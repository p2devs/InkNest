import React, {useEffect} from 'react';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {persistor, store} from './src/Redux/Store';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {RootNavigation} from './src/Navigation';
import Loading from './src/Components/UIComp/Loading';
import Toast from 'react-native-toast-message';
import {PaperProvider} from 'react-native-paper';
import ForceUpdate from './src/Components/ForceUpdate';
import {ConfigCatProvider} from 'configcat-react';
import {CONFIGCAT_SDK_KEY_TEST, CONFIGCAT_SDK_KEY_PROD} from '@env';
import {BannerProvider} from './src/Components/UIComp/AnimeAdBanner/BannerContext';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';

/**
 * The main App component that sets up the root of the application.
 * It includes the GestureHandlerRootView for gesture handling,
 * the Redux Provider for state management, and the PersistGate
 * for persisting the Redux store.
 *
 * @returns {JSX.Element} The root component of the application.
 */
const App = () => {
  useEffect(() => {
    if (!__DEV__) {
      // Initialize Firebase Crashlytics
      crashlytics().log('App mounted.');

      // Enable analytics collection
      analytics().setAnalyticsCollectionEnabled(true);

      // Catch JS errors and report to Crashlytics
      const errorHandler = (error, isFatal) => {
        if (isFatal) {
          crashlytics().recordError(error);
        }
        return false;
      };

      // Set error handlers
      ErrorUtils.setGlobalHandler(errorHandler);

      return () => {
        // Clean up if needed
      };
    }
  }, []);

  useEffect(() => {

    // const tagConfig = HomePageCardClasses['comichubfree']?.['popular-comic'];
    // const comicsData = [];

    // tagConfig hot-comic, new-comic & popular-comic for below code
    // if (tagConfig) {
    //   $(tagConfig.cardClass).each((index, element) => {
    //     const title = $(element).find(tagConfig.cardTitleClass).text().trim();
    //     let link = $(element).find(tagConfig.cardLinkClass).attr('href');
    //     if (link) {
    //       link = link.replace(/\/\d+$/, '');
    //     }
    //     let image = $(element).find(tagConfig.imageClass).attr('data-src');

    //     const chapterInfo = {};
    //     if (tagConfig?.chapterInfo) {
    //       const chapterName = $(element)
    //         .find(tagConfig.chapterInfo)
    //         .text()
    //         .trim();
    //       const chapterLink = $(element)
    //         .find(tagConfig.chapterInfo)
    //         .attr('href');
    //       chapterInfo.name = chapterName;
    //       chapterInfo.link = chapterLink;
    //     }

    //     const statusAndRelease = [];
    //     if (tagConfig?.statusClass) {
    //       const status = $(element).find(tagConfig.statusClass).text().trim();
    //       const statusParts = status.split('Released:');
    //       const statu = statusParts[0].split('Status:')[1].trim();
    //       const releaseDate = statusParts[1] ? statusParts[1].trim() : null;
    //       statusAndRelease.push(statu);
    //       statusAndRelease.push(releaseDate);
    //     }

    //     comicsData.push({
    //       title,
    //       link,
    //       image,
    //       chapterInfo: {
    //         chapterName: chapterInfo?.name ? chapterInfo?.name : null,
    //         chapterLink: chapterInfo?.link ? chapterInfo?.link : null,
    //       },
    //       status: statusAndRelease[0] ? statusAndRelease[0] : null,
    //       releaseDate: statusAndRelease[1] ? statusAndRelease[1] : null,
    //     });
    //   });
    // }

    // tagConfig latest-release for below code
    // if (tagConfig) {
    //   $(tagConfig.cardClass).each((index, element) => {
    //     const title = $(element).find(tagConfig.cardTitleClass).text().trim();
    //     let link = $(element).find(tagConfig.cardLinkClass).attr('href');
    //     if (link) {
    //       link = link.replace(/\/\d+$/, '');
    //     }
    //     let image = $(element).find(tagConfig.imageClass).attr('data-src');
    //     const genres = [];
    //     if (tagConfig.genresClass) {
    //       $(element)
    //         .find(tagConfig.genresClass)
    //         .each((i, genreElem) => {
    //           genres.push($(genreElem).text().trim());
    //         });
    //     }
    //     const chapterInfo = {};
    //     if (tagConfig?.chapterInfo) {
    //       const chapterName = $(element)
    //         .find(tagConfig.chapterInfo)
    //         .text()
    //         .trim();
    //       const chapterLink = $(element)
    //         .find(tagConfig.chapterInfo)
    //         .attr('href');
    //       chapterInfo.name = chapterName;
    //       chapterInfo.link = chapterLink;
    //     }
    //     comicsData.push({
    //       title,
    //       link,
    //       image,
    //       genres: genres.length > 0 ? genres[0] : null,
    //       chapterInfo: {
    //         chapterName: chapterInfo?.name ? chapterInfo?.name : null,
    //         chapterLink: chapterInfo?.link ? chapterInfo?.link : null,
    //       },
    //     });
    //   });
    // }
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ConfigCatProvider
        sdkKey={__DEV__ ? CONFIGCAT_SDK_KEY_TEST : CONFIGCAT_SDK_KEY_PROD}>
        <Provider store={store}>
          <PersistGate loading={<Loading />} persistor={persistor}>
            <PaperProvider>
              <BannerProvider>
                <RootNavigation />
                <Toast />
                <ForceUpdate />
              </BannerProvider>
            </PaperProvider>
          </PersistGate>
        </Provider>
      </ConfigCatProvider>
    </GestureHandlerRootView>
  );
};

export default App;
