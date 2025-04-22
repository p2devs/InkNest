import React, {memo, useState} from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {useDispatch, useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import Header from '../../../../Components/UIComp/Header';
import DescriptionView from '../../../../Components/UIComp/DescriptionView';
import {goBack} from '../../../../Navigation/NavigationService';
import {updateData} from '../../../../Redux/Reducers';
import {fetchComicDetails} from '../../../../Redux/Actions/GlobalActions';

const HeaderComponent = memo(
  ({image, title, link, tabBar, onTabBar, sort, setSORT}) => {
    const dispatch = useDispatch();
    const ComicDetail = useSelector(state => state.data.dataByUrl[link]);

    return (
      <SafeAreaView
        style={[styles.container, {marginBottom: 16}]}
        edges={['top']}>
        <View style={styles.headerContainer}>
          <Image
            style={{
              top: -heightPercentageToDP('30%'),
              borderRadius: heightPercentageToDP('50%'),
              width: widthPercentageToDP('100%'),
              height: heightPercentageToDP('52%'),
              position: 'absolute',
            }}
            resizeMode="cover"
            source={{
              uri: ComicDetail?.imgSrc ?? image,
            }}
            blurRadius={30}
          />
          <Header
            style={{
              width: '100%',
              height: heightPercentageToDP('4%'),
              backgroundColor: 'transparent',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
              borderBottomWidth: 0,
              marginBottom: 24,
            }}>
            <TouchableOpacity
              onPress={() => {
                goBack();
              }}>
              <Ionicons
                name="arrow-back"
                size={24}
                color="#fff"
                style={{marginRight: 10, opacity: 0.9}}
              />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: '#fff',
                opacity: 0.9,
              }}>
              Comic Details
            </Text>

            <View style={{flexDirection: 'row', gap: 16}}>
              <TouchableOpacity
                onPress={() => {
                  dispatch(
                    updateData({
                      url: link,
                      data: {Bookmark: !ComicDetail?.Bookmark},
                    }),
                  );
                }}>
                <Fontisto
                  name={`bookmark${ComicDetail?.Bookmark ? '-alt' : ''}`}
                  size={heightPercentageToDP('2.4%')}
                  color={ComicDetail?.Bookmark ? 'yellow' : '#FFF'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  dispatch(fetchComicDetails(link, true));
                }}>
                <Ionicons
                  name="refresh-outline"
                  size={heightPercentageToDP('2.4%')}
                  color={'#FFF'}
                />
              </TouchableOpacity>
            </View>
          </Header>

          <View
            style={{
              alignItems: 'center',
            }}>
            <View
              style={{
                borderRadius: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                width: 138,
                height: 194,
                paddingHorizontal: 8,
                paddingVertical: 8,
              }}>
              <Image
                style={{
                  borderRadius: 7,
                  height: 178,
                }}
                resizeMode="cover"
                source={{
                  uri: ComicDetail?.imgSrc ?? image,
                }}
              />
            </View>

            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#fff',
                textAlign: 'center',
                marginVertical: 16,
                width: widthPercentageToDP('60%'),
              }}>
              {ComicDetail?.title ?? title}
            </Text>
          </View>

          <View
            style={{
              paddingHorizontal: 16,
              gap: 6,
            }}>
            {
              <Text
                style={{
                  fontSize: 12,
                  color: '#fff',
                  opacity: 0.8,
                }}>{`${
                  ComicDetail?.releaseDate
                    ? ComicDetail?.releaseDate +
                      (ComicDetail?.status ? ' · ' : '')
                    : ''
                }${
                ComicDetail?.genres && ComicDetail?.genres?.length > 0
                  ? ComicDetail?.genres?.toString() + ' · '
                  : ComicDetail?.tags && ComicDetail?.tags?.length > 0
                  ? ComicDetail?.tags?.toString() + ' · '
                  : ''
              }${
                ComicDetail?.status
                  ? ComicDetail?.status + (ComicDetail?.author || ComicDetail?.categories ? ' · ' : '')
                  : ''
              }${
                ComicDetail?.author || ComicDetail?.categories
                  ? 'By - ' + (ComicDetail?.author || ComicDetail?.categories)
                  : ''
              }`}</Text>
            }
            {ComicDetail?.summary ? (
              <DescriptionView vol={ComicDetail?.summary} />
            ) : null}
          </View>

          <View
            style={{
              flexDirection: 'row',
              marginTop: 24,
              paddingHorizontal: 16,
              borderBottomColor: 'rgba(255,255,255,0.1)',
              borderBottomWidth: 1,
              justifyContent: 'space-between',
            }}>
            <View
              style={{
                flexDirection: 'row',
              }}>
              {tabBar.map((tab, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    onTabBar(index);
                  }}
                  style={{
                    marginRight: 28,
                    borderBottomColor: tab.active ? '#3268de' : 'transparent',
                    borderBottomWidth: 2,
                    paddingBottom: 4,
                    flexDirection: 'row',
                    gap: 6,
                  }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: tab.active
                        ? 'rgba(255,255,255,1)'
                        : 'rgba(255,255,255,0.45)',
                    }}>
                    {tab.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <FontAwesome5
              name={sort ? 'sort-numeric-up' : 'sort-numeric-down-alt'}
              size={heightPercentageToDP('2.2%')}
              color={'#fff'}
              onPress={() => {
                setSORT();
              }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  },
);

export default HeaderComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142a',
  },
});
