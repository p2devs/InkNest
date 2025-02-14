import React, {useEffect, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';

import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {useDispatch, useSelector} from 'react-redux';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';
import {getVersion} from 'react-native-device-info';
import {useFeatureFlag} from 'configcat-react';

import {
  fetchComicBook,
  fetchComicDetails,
} from '../../../Redux/Actions/GlobalActions';
import LoadingModal from '../../../Components/UIComp/LoadingModal';
import Error from '../../../Components/UIComp/Error';
import ChapterCard from './ChapterCard';
import HeaderComponent from './Components/HeaderComponent';
import {AppendAd} from '../../../InkNest-Externals/Ads/AppendAd';

export function ComicDetails({route}) {
  const [PageLink, setPageLink] = useState(route?.params?.link);
  const [tabBar, setTabBar] = useState([
    {name: 'Chapters', active: true},
    {name: 'Bookmarks', active: false},
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

  const reverseChapterList = () => {
    if (getVersion() === forIosValue && forIosLoading === false) {
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
    dispatch(fetchComicDetails(PageLink));
  }, [PageLink]);

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
              crashlytics().log('Comic Details Tab Clicked');
              analytics().logEvent('Comic_Details_Tab_Clicked', {
                TabName: tabBar[index].name?.toString(),
              });
              tabBar.map(tab => (tab.active = false));
              tabBar[index].active = true;
              setTabBar([...tabBar]);
            }}
            sort={sort}
            setSORT={() => {
              crashlytics().log('Comic Details Sort Clicked');
              analytics().logEvent('Comic_Details_Sort_Clicked');
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
          <View style={{height: heightPercentageToDP('5%')}} />
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
