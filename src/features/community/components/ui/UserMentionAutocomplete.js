import React, {useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import UserAvatar from '../Auth/UserAvatar';
import {getTierBadgeColor, getTierDisplayName} from '../../constants/SubscriptionFeatures';

/**
 * UserMentionAutocomplete Component
 * Shows a list of users to mention when user types @
 */
const UserMentionAutocomplete = ({
  participants = [],
  searchQuery = '',
  onSelect,
  visible = false,
  currentUserId = null,
}) => {
  const filteredParticipants = useMemo(() => {
    if (!searchQuery || searchQuery.length === 0) {
      return participants;
    }

    const query = searchQuery.toLowerCase();
    return participants.filter(participant => {
      const name = (participant.name || '').toLowerCase();
      return name.includes(query);
    });
  }, [participants, searchQuery]);

  if (!visible || filteredParticipants.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Mention someone</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled>
        {filteredParticipants.slice(0, 8).map(participant => {
          const badgeColor = getTierBadgeColor(participant.tier);
          const tierName = getTierDisplayName(participant.tier);
          const isCurrentUser = participant.id === currentUserId;

          return (
            <TouchableOpacity
              key={participant.id}
              style={styles.participantItem}
              onPress={() => onSelect(participant)}
              activeOpacity={0.7}>
              <UserAvatar
                photoURL={participant.photoURL}
                displayName={participant.name}
                size={32}
                showBadge={!!tierName}
                badgeColor={badgeColor}
              />
              <View style={styles.participantInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.participantName} numberOfLines={1}>
                    {participant.name}
                  </Text>
                  {isCurrentUser && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>YOU</Text>
                    </View>
                  )}
                </View>
                {tierName && (
                  <View style={[styles.tierPill, {backgroundColor: `${badgeColor}22`}]}>
                    <Text style={[styles.tierText, {color: badgeColor}]}>
                      {tierName}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    maxHeight: 280,
    backgroundColor: 'rgba(20, 20, 42, 0.98)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollView: {
    maxHeight: 220,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  participantInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(95, 227, 163, 0.2)',
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5FE3A3',
  },
  tierPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default UserMentionAutocomplete;
