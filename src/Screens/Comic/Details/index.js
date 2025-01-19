import React, {useCallback, useEffect, useState} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';

import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';

import {useDispatch, useSelector} from 'react-redux';
import {
  fetchComicBook,
  fetchComicDetails,
} from '../../../Redux/Actions/GlobalActions';
import LoadingModal from '../../../Components/UIComp/LoadingModal';
import Error from '../../../Components/UIComp/Error';
import ChapterCard from './ChapterCard';
import HeaderComponent from './Components/HeaderComponent';
import {AppendAd} from '../../../Components/Ads/AppendAd';

export function ComicDetails({route}) {
  const {link, image, title, isComicBookLink} = route.params;
  const [PageLink, setPageLink] = useState(isComicBookLink ? null : link);
  const [tabBar, setTabBar] = useState([
    {name: 'Chapters', active: true},
    {name: 'Bookmarks', active: false},
  ]);

  const [sort, setSort] = useState(false);

  const dispatch = useDispatch();

  const loading = useSelector(state => state.data.loading);
  const error = useSelector(state => state.data.error);
  const ComicDetail = useSelector(state => state.data.dataByUrl[PageLink]);

  const reverseChapterList = () => {
    const chapterList = ComicDetail?.issues ?? ComicDetail?.chapters;
    if (!chapterList) return [];
    if (!sort) return [...chapterList];
    return [...chapterList].reverse();
  };

  useEffect(() => {
    if (isComicBookLink && !PageLink) {
      dispatch(fetchComicBook(link, setPageLink));
    } else {
      dispatch(fetchComicDetails(PageLink));
    }
  }, [PageLink]);

  if (error) return <Error error={error} />;

  return (
    <>
      <LoadingModal loading={loading} />
      <FlatList
        ListHeaderComponent={
          <HeaderComponent
            link={PageLink}
            image={image}
            title={title}
            tabBar={tabBar}
            onTabBar={index => {
              tabBar.map(tab => (tab.active = false));
              tabBar[index].active = true;
              setTabBar([...tabBar]);
            }}
            sort={sort}
            setSORT={() => {
              setSort(!sort);
            }}
          />
        }
        data={AppendAd(reverseChapterList())}
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
