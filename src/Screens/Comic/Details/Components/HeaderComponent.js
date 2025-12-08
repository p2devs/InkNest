import React, {memo} from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';

import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {useDispatch, useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';

import Header from '../../../../Components/UIComp/Header';
import DescriptionView from '../../../../Components/UIComp/DescriptionView';
import {goBack} from '../../../../Navigation/NavigationService';
import {updateData} from '../../../../Redux/Reducers';
import {fetchComicDetails} from '../../../../Redux/Actions/GlobalActions';

const HeaderComponent = memo(
  ({
    image,
    title,
    link,
    tabBar,
    onTabBar,
    notificationBell,
    onRequestLoginPrompt,
  }) => {
    const dispatch = useDispatch();
    const ComicDetail = useSelector(state => state.data.dataByUrl[link]);
    const bellBusy = notificationBell?.loading || notificationBell?.syncing;
    const bellDisabled = bellBusy || !notificationBell?.canToggle;
    const shouldRenderBell = !!notificationBell;

    return (
      <SafeAreaView
        style={[styles.container, {marginBottom: 16}]}
        edges={['top']}>
        <View style={styles.headerContainer}>
          <Image
            style={{
              top: -widthPercentageToDP('60%'),
              borderRadius: heightPercentageToDP('50%'),
              width: widthPercentageToDP('100%'),
              height: widthPercentageToDP('100%'),
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

            <View style={{flexDirection: 'row', gap: 16, alignItems: 'center'}}>
              {shouldRenderBell ? (
                <TouchableOpacity
                  onPress={() => {
                    if (!notificationBell.enabled) {
                      onRequestLoginPrompt?.();
                      return;
                    }
                    if (notificationBell.restricted) {
                      notificationBell.toggleSubscription();
                      return;
                    }
                    if (bellDisabled) {
                      Alert.alert(
                        'Want to Enable Notifications?',
                        'contact the InkNest admin team to enable notifications for your account.',
                      );
                      return;
                    }
                    notificationBell.toggleSubscription();
                  }}
                  disabled={bellBusy}
                  style={{
                    opacity: bellBusy || notificationBell.restricted ? 0.6 : 1,
                  }}>
                  {bellBusy ? (
                    <ActivityIndicator
                      size={heightPercentageToDP('2.2%')}
                      color="#FFF"
                    />
                  ) : (
                    <MaterialIcons
                      name={
                        notificationBell.isSubscribed
                          ? 'notifications-on'
                          : 'notifications-none'
                      }
                      size={heightPercentageToDP('3%')}
                      color={
                        notificationBell.isSubscribed
                          ? 'gold'
                          : notificationBell.restricted
                          ? 'rgba(255,255,255,0.5)'
                          : '#FFF'
                      }
                      style={
                        !notificationBell.enabled
                          ? {opacity: 0.5}
                          : notificationBell.restricted
                          ? {opacity: 0.7}
                          : null
                      }
                    />
                  )}
                </TouchableOpacity>
              ) : null}
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
              marginTop: Platform.isPad ? widthPercentageToDP('20%') : 0,
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
                  ? ComicDetail?.status +
                    (ComicDetail?.author || ComicDetail?.categories
                      ? ' · '
                      : '')
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
