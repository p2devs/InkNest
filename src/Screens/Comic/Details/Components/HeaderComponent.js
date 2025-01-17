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
import Ionicons from 'react-native-vector-icons/Ionicons';

import Header from '../../../../Components/UIComp/Header';
import DescriptionView from '../../../../Components/UIComp/DescriptionView';
import { goBack } from '../../../../Navigation/NavigationService';

const HeaderComponent = memo(({ComicDetail, image, title, tabBar, onTabBar}) => {

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

          <View style={{flex: 0.15}} />
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
              ComicDetail?.genres ? ComicDetail?.genres?.toString() + ' · ' : ''
            }${
              ComicDetail?.yearOfRelease
                ? ComicDetail?.yearOfRelease + ' · '
                : ''
            }${ComicDetail?.status ? ComicDetail?.status + ' · ' : ''}${
              ComicDetail?.publisher ? 'By - ' + ComicDetail?.publisher : ''
            }`}</Text>
          }
          {ComicDetail?.volumes && (
            <View>
              {ComicDetail?.volumes.map((vol, index) => (
                <DescriptionView key={index} index={index} vol={vol} />
              ))}
            </View>
          )}
        </View>

        <View
          style={{
            flexDirection: 'row',
            marginTop: 24,
            paddingHorizontal: 16,
            borderBottomColor: 'rgba(255,255,255,0.1)',
            borderBottomWidth: 1,
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
    </SafeAreaView>
  );
});

export default HeaderComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14142a',
  },
});
