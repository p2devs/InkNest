import React, { useEffect, useState } from 'react';
import {
  View,
  // Image,
  Dimensions,
  TouchableOpacity,
  FlatList,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import Entypo from 'react-native-vector-icons/Entypo';

import { fetchComicBook } from '../../Redux/Actions/GlobalActions';
import Loading from '../../Components/UIComp/Loading';
import Error from '../../Components/UIComp/Error';
import Gallery from '../../Components/Gallery/src/index';
import { updateData } from '../../Redux/Reducers';
import ComicBookHeader from '../../Components/UIComp/ComicBookHeader';
import ComicBookFooter from '../../Components/UIComp/ComicBookFooter';
import Image from '../../Components/UIComp/Image';

export function ComicBook({ navigation, route }) {
  const { comicBook, pageJump } = route?.params;
  const dispatch = useDispatch();
  const ComicBook = useSelector(state => state.data.dataByUrl[comicBook]);
  const loading = useSelector(state => state.data.loading);
  const error = useSelector(state => state.data.error);
  const [PageIndex, setPageIndex] = useState(
    pageJump ?? ComicBook?.lastReadPage ?? 0,
  );
  const [ViewAll, setViewAll] = useState(false);

  const { width } = Dimensions.get('window');
  const numColumns = 3;
  const imageSize = width / numColumns - 10;
  useEffect(() => {
    dispatch(fetchComicBook(comicBook));
  }, [comicBook, dispatch]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error error={error} />;
  }

  const GridImageItem = props => {
    const { item, index } = props;
    return (
      <TouchableOpacity
        key={index}
        onPress={() => {
          // console.log("Image Clicked", props);
          setPageIndex(index);
          setViewAll(false);
        }}
        style={{
          margin: 5,
          borderRadius: 5,
          overflow: 'hidden',
          backgroundColor: '#333',
        }}>
        <Image
          source={{ uri: item }}
          style={{
            width: imageSize,
            height: imageSize,
          }}
        />
        {ComicBook?.BookmarkPages?.includes(index) && (
          <Entypo
            name="bookmark"
            size={24}
            color="yellow"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1,
            }}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#222' }}
      edges={['top', 'bottom']}>
      <View style={{ flex: 1 }}>
        {ViewAll ? (
          <FlatList
            data={ComicBook?.images}
            renderItem={({ item, index }) => (
              <GridImageItem item={item} index={index} />
            )}
            keyExtractor={(item, index) => index.toString()}
            numColumns={numColumns}
            key={numColumns}
            style={{
              flex: 1,
              marginVertical: 60,
            }}
          />
        ) : ComicBook?.images ? (
          <Gallery
            data={ComicBook?.images}
            onIndexChange={newIndex => {
              dispatch(
                updateData({ url: comicBook, data: { lastReadPage: newIndex } }),
              );
              setPageIndex(newIndex);
            }}
            initialIndex={PageIndex}
          />
        ) : null}
        <ComicBookHeader
          comicBook={comicBook}
          PageIndex={PageIndex}
          ViewAll={ViewAll}
        />
        <ComicBookFooter
          comicBook={comicBook}
          setViewAll={setViewAll}
          ViewAll={ViewAll}
          navigation={navigation}
        />
      </View>
    </SafeAreaView>
  );
}
