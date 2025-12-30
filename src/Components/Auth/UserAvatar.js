import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';

/**
 * UserAvatar Component
 * Displays user profile picture or initials fallback
 */

const UserAvatar = ({photoURL, displayName, size = 40, showBadge, badgeColor}) => {
  const getInitials = name => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(displayName);

  return (
    <View style={{position: 'relative'}}>
      {photoURL ? (
        <Image
          source={{uri: photoURL}}
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.avatarFallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}>
          <Text
            style={[
              styles.initials,
              {
                fontSize: size * 0.4,
              },
            ]}>
            {initials}
          </Text>
        </View>
      )}

      {showBadge && badgeColor && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badgeColor,
              width: size * 0.25,
              height: size * 0.25,
              borderRadius: (size * 0.25) / 2,
              right: size * 0.05,
              bottom: size * 0.05,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#333',
  },
  avatarFallback: {
    backgroundColor: '#3268de',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#14142a',
  },
});

export default UserAvatar;
