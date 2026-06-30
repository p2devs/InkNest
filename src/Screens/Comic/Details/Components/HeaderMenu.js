import React, {useState, useRef, useCallback} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';

const HeaderMenu = ({
  notificationBell,
  onBookmark,
  onRefresh,
  isBookmarked,
  bellBusy,
  bellDisabled,
  onRequestLoginPrompt,
}) => {
  const [visible, setVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    setVisible(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const closeMenu = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }, [scaleAnim]);

  const handleNotificationPress = () => {
    closeMenu();
    setTimeout(() => {
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
          'Notifications are reserved for supporters. Please consider supporting us to enable them—contact us on Discord for more information.',
        );
        return;
      }
      notificationBell.toggleSubscription();
    }, 200);
  };

  const handleBookmarkPress = () => {
    closeMenu();
    setTimeout(onBookmark, 200);
  };

  const handleRefreshPress = () => {
    closeMenu();
    setTimeout(onRefresh, 200);
  };

  const shouldRenderBell = !!notificationBell;

  return (
    <>
      <TouchableOpacity
        onPress={openMenu}
        style={styles.menuButton}
        activeOpacity={0.7}>
        <Ionicons
          name="ellipsis-horizontal"
          size={24}
          color="#fff"
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeMenu}>
          <Animated.View
            style={[
              styles.menuContainer,
              {transform: [{scale: scaleAnim}]},
            ]}>
            {shouldRenderBell && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleNotificationPress}
                disabled={bellBusy}>
                <View style={styles.iconContainer}>
                  {bellBusy ? (
                    <ActivityIndicator size="small" color="#3268de" />
                  ) : (
                    <MaterialIcons
                      name={
                        notificationBell.isSubscribed
                          ? 'notifications-on'
                          : 'notifications-none'
                      }
                      size={22}
                      color={
                        notificationBell.isSubscribed
                          ? '#FFD700'
                          : notificationBell.restricted
                          ? 'rgba(255,255,255,0.5)'
                          : '#fff'
                      }
                    />
                  )}
                </View>
                <Text style={styles.menuText}>
                  {notificationBell.isSubscribed
                    ? 'Notifications On'
                    : 'Notifications'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleBookmarkPress}>
              <View style={styles.iconContainer}>
                <Fontisto
                  name={`bookmark${isBookmarked ? '-alt' : ''}`}
                  size={18}
                  color={isBookmarked ? '#FFD700' : '#fff'}
                />
              </View>
              <Text style={styles.menuText}>
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={handleRefreshPress}>
              <View style={styles.iconContainer}>
                <Ionicons name="refresh-outline" size={22} color="#fff" />
              </View>
              <Text style={styles.menuText}>Refresh</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuContainer: {
    position: 'absolute',
    top: heightPercentageToDP('8%'),
    right: widthPercentageToDP('4%'),
    backgroundColor: '#1e1e3f',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HeaderMenu;
