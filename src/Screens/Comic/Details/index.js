import React, {useEffect, useState} from 'react';
import {FlatList, StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useFeatureFlag} from 'configcat-react';
import {isMacOS} from '../../../Utils/PlatformUtils';

import {fetchComicDetails} from '../../../Redux/Actions/GlobalActions';
import LoadingModal from '../../../Components/UIComp/LoadingModal';
import Error from '../../../Components/UIComp/Error';
import ChapterCard from './ChapterCard';
import HeaderComponent from './Components/HeaderComponent';
import {AppendAd} from '../../../InkNest-Externals/Ads/AppendAd';
import PaginationFooter from './Components/FooterPagination';
import {rewardAdsShown} from '../../../Redux/Reducers';
import {showRewardedAd} from '../../../InkNest-Externals/Redux/Actions/Download';

// Conditional imports for Firebase
let crashlytics, analytics, getVersion;
if (!isMacOS) {
  try {
    crashlytics = require('@react-native-firebase/crashlytics').default;
    analytics = require('@react-native-firebase/analytics').default;
    getVersion = require('react-native-device-info').getVersion;
  } catch (error) {
    console.log('Firebase/device-info modules not available:', error.message);
  }
}

export function ComicDetails({route, navigation}) {
  const [PageLink, setPageLink] = useState(route?.params?.link);
  const [tabBar, setTabBar] = useState([
    {name: 'Chapters', active: true},
    // {name: 'Bookmarks', active: false},
  ]);
  const {value: forIosValue, loading: forIosLoading} = useFeatureFlag(
    'forIos',
    'Default',
  );

  const [sort, setSort] = useState(false);

  const dispatch = useDispatch();

  const loading = useSelector(state => state.data.loading);
  const error = useSelector(state => state.data.error);
  const ComicDetail = useSelector(state => state.data.dataByUrl[PageLink]);
  const hasRewardAdsShown = useSelector(state => state.data.hasRewardAdsShown);

  const reverseChapterList = () => {
    if (getVersion && getVersion() === forIosValue && forIosLoading === false) {
      return [
        {
          link: 'https://comicbookplus.com/?dlid=16848',
          date: 'December 4, 2010',
          title: 'Issues 1',
        },
        {
          link: 'https://comicbookplus.com/?dlid=15946',
          date: 'November 27, 2010',
          title: 'Issues 2',
        },
        {
          link: 'https://comicbookplus.com/?dlid=16857',
          date: 'December 4, 2010',
          title: 'Issues 3',
        },
        {
          link: 'https://comicbookplus.com/?cid=860',
          date: 'August 7, 2015',
          title: 'Issues 4',
        },
      ];
    } else {
      if (forIosLoading === false) {
        const chapterList = ComicDetail?.chapters;
        if (!chapterList) return [];
        if (!sort) return [...chapterList];
        return [...chapterList].reverse();
      }
    }
  };

  useEffect(() => {
    (async () => {
      if (!hasRewardAdsShown && !isMacOS) {
        if (crashlytics) crashlytics().log('Reward Ads Shown');
        if (analytics) analytics.logEvent('Reward_Ads_Shown');
        await showRewardedAd();
        dispatch(rewardAdsShown(!hasRewardAdsShown));
      }
    })();
  }, [hasRewardAdsShown]);
  
  
  useEffect(() => {
    if (getVersion && getVersion() === forIosValue && forIosLoading === false) {
    } else {
      if (forIosLoading === false) {
        dispatch(fetchComicDetails(PageLink));
      }
    }
  }, [PageLink, forIosLoading]);

  if (error) return <Error error={error} />;

  return (
    <>
      <LoadingModal loading={loading} />
      <FlatList
        ListHeaderComponent={
          <HeaderComponent
            link={PageLink}
            image={route?.params?.image}
            title={route?.params?.title}
            tabBar={tabBar}
            onTabBar={index => {
              if (!isMacOS) {
                if (crashlytics) crashlytics().log('Comic Details Tab Clicked');
                if (analytics) analytics.logEvent('Comic_Details_Tab_Clicked', {
                  TabName: tabBar[index].name?.toString(),
                });
              }
              tabBar.map(tab => (tab.active = false));
              tabBar[index].active = true;
              setTabBar([...tabBar]);
            }}
            sort={sort}
            setSORT={() => {
              if (!isMacOS) {
                if (crashlytics) crashlytics().log('Comic Details Sort Clicked');
                if (analytics) analytics.logEvent('Comic_Details_Sort_Clicked');
              }
              setSort(!sort);
            }}
          />
        }
        data={forIosLoading === false ? AppendAd(reverseChapterList()) : []}
        style={styles.container}
        renderItem={({item, index}) => (
          <ChapterCard
            item={item}
            index={index}
            isBookmark={tabBar[1]?.active}
            detailPageLink={PageLink}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <PaginationFooter
            pagination={ComicDetail?.pagination}
            pageLink={PageLink}
            route={route}
            navigation={navigation}
          />
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142a',
  },
});
