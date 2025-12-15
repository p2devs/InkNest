import React, {useMemo} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {getVersion} from 'react-native-device-info';

import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {Settings} from '../Screens';
import {NAVIGATION} from '../Constants';
import {Home, Library} from '../Screens/Comic';
import {View, StyleSheet} from 'react-native';
import {useFeatureFlag} from 'configcat-react';
import {useSelector} from 'react-redux';
import LinkListScreen from '../InkNest-Externals/Screens/Webview/LinkListScreen';
import FloatingDonationButton from '../InkNest-Externals/Donation/FloatingDonationButton';
import CommunityBoardScreen from '../InkNest-Externals/Community/Screens/CommunityBoardScreen';
import {heightPercentageToDP} from 'react-native-responsive-screen';

const BottomTab = createBottomTabNavigator();

/**
 * TabBarIcon component renders an icon based on the provided name prop.
 *
 * @param {Object} props - The properties object.
 * @param {string} props.name - The name of the icon to render.
 * @param {number} [props.size=24] - The size of the icon.
 * @param {string} props.tintColor - The color of the icon.
 * @returns {JSX.Element} The icon component.
 */
const TabBarIcon = ({name, tintColor, size = 24}) => {
  if (name === 'home') {
    return <Feather name={name} size={size} color={tintColor} />;
  } else if (name === 'library') {
    return <Ionicons name={name} size={size} color={tintColor} />;
  } else if (name === 'download-for-offline' || name === 'source') {
    return <MaterialIcons name={name} size={size} color={tintColor} />;
  } else if (name === 'settings') {
    return <Feather name={name} size={size} color={tintColor} />;
  } else if (name === 'community') {
    return (
      <Ionicons name="chatbubbles-outline" size={size} color={tintColor} />
    );
  }
};

/**
 * BottomNavigation component renders the bottom tab navigator with different screens.
 * It uses Redux state to conditionally render components based on the state values.
 *
 * @returns {JSX.Element} The BottomTab.Navigator component with configured screens.
 */
export function BottomNavigation() {
  const {value: forIosValue} = useFeatureFlag('forIos', 'Default');
  const notifications = useSelector(state => state.data?.notifications || []);
  const hasUnreadNotifications = useMemo(
    () => notifications.some(notification => !notification?.read),
    [notifications],
  );

  return (
    <>
      <BottomTab.Navigator
        screenOptions={{
          tabBarBackground: () => (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: '#110918',
                },
              ]}
            />
          ),
          headerShown: false,
          tabBarActiveTintColor: '#D2D2D6',
          tabBarInactiveTintColor: '#6B666D',
          tabBarStyle: {
            paddingVertical: 4,
          },
        }}
        appearance={{
          shadow: true,
          floating: true,
        }}>
        <BottomTab.Screen
          name={NAVIGATION.home}
          component={Home}
          options={{
            tabBarIcon: ({focused, color}) => (
              <TabBarIcon focused={focused} tintColor={color} name="home" />
            ),
          }}
        />

        <BottomTab.Screen
          name={NAVIGATION.Library}
          component={Library}
          options={{
            tabBarIcon: ({focused, color}) => (
              <TabBarIcon focused={focused} tintColor={color} name="library" />
            ),
            tabBarBadge: hasUnreadNotifications ? 1 : undefined,
            tabBarBadgeStyle: {
              maxWidth: heightPercentageToDP('.86%'),
              maxHeight: heightPercentageToDP('0.9%'),
              fontSize: 1,
            },
          }}
        />

        {getVersion() !== forIosValue && (
          <BottomTab.Screen
            name={NAVIGATION.sources}
            component={LinkListScreen}
            options={{
              tabBarIcon: ({focused, color}) => (
                <TabBarIcon focused={focused} tintColor={color} name="source" />
              ),
            }}
          />
        )}

        <BottomTab.Screen
          name={NAVIGATION.communityBoard}
          component={CommunityBoardScreen}
          options={{
            tabBarLabel: 'Community',
            tabBarIcon: ({focused, color}) => (
              <TabBarIcon
                focused={focused}
                tintColor={color}
                name="community"
              />
            ),
            tabBarBadge: hasUnreadNotifications ? 1 : undefined,
            tabBarBadgeStyle: {
              maxWidth: heightPercentageToDP('.86%'),
              maxHeight: heightPercentageToDP('0.9%'),
              fontSize: 1,
            },
          }}
        />

        {getVersion() !== forIosValue && (
          <BottomTab.Screen
            name={NAVIGATION.settings}
            component={Settings}
            options={{
              tabBarIcon: ({focused, color}) => (
                <TabBarIcon
                  focused={focused}
                  tintColor={color}
                  name="settings"
                />
              ),
            }}
          />
        )}
      </BottomTab.Navigator>
      {getVersion() !== forIosValue && <FloatingDonationButton />}
    </>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F74B78',
  },
});
