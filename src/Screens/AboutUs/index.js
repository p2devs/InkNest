import React from 'react';
import {View, Text, TouchableOpacity, Linking} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {heightPercentageToDP as hp} from 'react-native-responsive-screen';

import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Header from '../../Components/UIComp/Header';
import Markdown from '../../Components/UIComp/MarkDown';

export function AboutUs({navigation}) {
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#222'}} edges={['top']}>
      <Header
        style={{
          width: '100%',
          height: hp('4%'),
          backgroundColor: '#222',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
          borderBottomColor: '#fff',
          borderBottomWidth: 0.5,
          marginBottom: 5,
        }}>
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
          }}>
          <Ionicons
            name="chevron-back"
            size={hp('3%')}
            color="#fff"
            style={{marginRight: 10}}
          />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: hp('2%'),
            fontWeight: 'bold',
            color: '#FFF',
          }}>
          About Us
        </Text>

        <View
          style={{
            flex: 0.1,
          }}
        />
      </Header>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={{
            flex: 1,
            paddingHorizontal: hp('2%'),
            paddingVertical: hp('2%'),
          }}>
          <Text
            animation={'fadeInLeftBig'}
            duration={1000}
            ease-in-out-expo
            direction="alternate"
            allowFontScaling={false}
            style={{
              fontSize: hp('4.5%'),
              color: 'rgba(99, 96, 255, 1)',
              marginVertical: hp('2%'),
              fontWeight: 'bold',
            }}>
            InkNest
          </Text>

          <Markdown
            content={`InkNest is your ultimate app for enjoying a vast collection of comic books and anime right on your mobile device, completely free of charge. Dive into a universe where you can explore thrilling adventures, captivating stories, and stunning artwork from a wide range of genres and publishers. Whether you're into superheroes, sci-fi, fantasy, manga, or anime, InkNest offers a seamless reading and viewing experience with user-friendly navigation and customizable settings to enhance your enjoyment. Stay updated with the latest releases and classics alike.\nDiscover, read, watch, and immerse yourself in the world of comics and anime with InkNest, designed for enthusiasts of all ages. Enjoy content from popular anime studios like Studio Ghibli, Toei Animation, and Madhouse, as well as renowned comic publishers such as Marvel, DC Comics, and Dark Horse. With InkNest, your favorite stories and characters are always at your fingertips.
`}
          />
          <View
            style={{
              marginVertical: hp('5%'),
            }}>
            <Text
              style={{
                fontSize: hp('2.5%'),
                color: 'rgba(99, 96, 255, 1)',
                marginVertical: hp('2%'),
              }}>
              Contact Us
            </Text>
            <View style={{gap: 15, flexDirection: 'row'}}>
              <TouchableOpacity
                style={{flexDirection: 'row', gap: 12}}
                onPress={() => {
                  //open email app with pre-filled email
                  Linking.openURL('mailto:inknest@2hub.live');
                }}>
                <Entypo name="email" size={20} color="#007AFF" />
              </TouchableOpacity>

              {/* //github page */}
              <TouchableOpacity
                style={{flexDirection: 'row', gap: 12}}
                onPress={() => {
                  Linking.openURL('https://github.com/p2devs/inknest-release');
                }}>
                <Ionicons name="logo-github" size={20} color="#007AFF" />
              </TouchableOpacity>

              {/* //Linkdin page */}
              <TouchableOpacity
                style={{flexDirection: 'row', gap: 12}}
                onPress={() => {
                  Linking.openURL('https://www.linkedin.com/company/p2-devs/');
                }}>
                <Ionicons name="logo-linkedin" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{flexDirection: 'row', gap: 12}}
                onPress={() => {
                  Linking.openURL('https://discord.gg/WYwJefvWNT');
                }}>
                <MaterialIcons name="discord" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
