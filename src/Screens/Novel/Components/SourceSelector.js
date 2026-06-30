import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {NovelHostName} from '../../../Utils/APIs';
import {useSourceStatus} from '../../../Utils/hooks/useSourceStatus';
import {switchNovelSource} from '../../../Redux/Actions/NovelActions';
import {getSourceLabel} from '../../../Utils/sourceStatus';

/**
 * Status indicator component showing source health
 */
function StatusIndicator({status, size = 10}) {
  const getStatusColor = () => {
    if (!status) {
      return '#888';
    }
    switch (status.status) {
      case 'working':
        return '#4CAF50';
      case 'cloudflare_protected':
        return '#FF9800';
      case 'server_down':
        return '#F44336';
      default:
        return '#888';
    }
  };

  return (
    <View
      style={[
        styles.statusDot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getStatusColor(),
        },
      ]}
    />
  );
}

/**
 * Individual source item component (needed for hooks)
 */
function SourceItem({item, isSelected, showStatus, onSelect}) {
  const sourceStatus = useSourceStatus(item.key);

  return (
    <TouchableOpacity
      style={[
        styles.sourceItem,
        isSelected && styles.sourceItemSelected,
        !item.enabled && styles.sourceItemDisabled,
      ]}
      onPress={() => item.enabled && onSelect(item.key)}
      disabled={!item.enabled}
      activeOpacity={0.7}>
      <View style={styles.sourceItemContent}>
        <View style={styles.sourceItemLeft}>
          {showStatus && (
            <StatusIndicator status={sourceStatus.status} size={12} />
          )}
          <Text
            style={[
              styles.sourceItemName,
              isSelected && styles.sourceItemNameSelected,
              !item.enabled && styles.sourceItemNameDisabled,
            ]}>
            {item.name}
          </Text>
        </View>
        {isSelected && (
          <Ionicons
            name="checkmark-circle"
            size={22}
            color="#4CAF50"
          />
        )}
      </View>
      {!item.enabled && (
        <Text style={styles.disabledLabel}>Disabled</Text>
      )}
    </TouchableOpacity>
  );
}

/**
 * SourceSelector Component
 * A dropdown/modal component for selecting novel sources.
 *
 * @param {Object} props - Component props
 * @param {Function} [props.onSourceChange] - Optional callback when source changes
 * @param {Object} [props.style] - Optional custom styles for the container
 * @param {boolean} [props.showStatus=true] - Whether to show source status indicators
 */
export function SourceSelector({
  onSourceChange,
  style,
  showStatus = true,
}) {
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);

  // Get current source and available sources from Redux
  const novelBaseUrl = useSelector(state => state.data.novelBaseUrl || 'novelfire');
  const novelSources = useSelector(state => state.data.novelSources || {});

  // Get current source details
  const currentSourceKey = novelBaseUrl;
  const currentSourceName = getSourceLabel(currentSourceKey);
  const currentSourceStatus = useSourceStatus(currentSourceKey);

  // Build list of available sources
  const availableSources = useMemo(() => {
    const sources = Object.keys(NovelHostName);
    return sources.map(key => ({
      key,
      name: getSourceLabel(key),
      url: NovelHostName[key],
      enabled: novelSources[key]?.enabled !== false,
    }));
  }, [novelSources]);

  // Handle source selection
  const handleSelectSource = sourceKey => {
    if (sourceKey !== currentSourceKey) {
      dispatch(switchNovelSource(sourceKey));
      onSourceChange?.(sourceKey);
    }
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Selector Button */}
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}>
        <View style={styles.selectorContent}>
          {showStatus && (
            <StatusIndicator status={currentSourceStatus.status} size={10} />
          )}
          <Text style={styles.selectorText} numberOfLines={1}>
            {currentSourceName}
          </Text>
          <Ionicons
            name="chevron-down"
            size={18}
            color="#FFF"
          />
        </View>
      </TouchableOpacity>

      {/* Source Selection Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        />

        {/* Modal Content */}
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Novel Source</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Source List */}
          <FlatList
            data={availableSources}
            keyExtractor={item => item.key}
            renderItem={({item}) => (
              <SourceItem
                item={item}
                isSelected={item.key === currentSourceKey}
                showStatus={showStatus}
                onSelect={handleSelectSource}
              />
            )}
            contentContainerStyle={styles.sourceList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="book-off"
                  size={48}
                  color="#666"
                />
                <Text style={styles.emptyText}>No sources available</Text>
              </View>
            }
          />

          {/* Status Legend */}
          {showStatus && (
            <View style={styles.legendContainer}>
              <Text style={styles.legendTitle}>Status:</Text>
              <View style={styles.legendItem}>
                <StatusIndicator status={{status: 'working'}} size={8} />
                <Text style={styles.legendText}>Working</Text>
              </View>
              <View style={styles.legendItem}>
                <StatusIndicator status={{status: 'cloudflare_protected'}} size={8} />
                <Text style={styles.legendText}>Protected</Text>
              </View>
              <View style={styles.legendItem}>
                <StatusIndicator status={{status: 'server_down'}} size={8} />
                <Text style={styles.legendText}>Down</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Container styles can be overridden by style prop
  },
  selectorButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorText: {
    color: '#FFF',
    fontSize: hp('1.8%'),
    fontWeight: '500',
    flex: 1,
  },
  statusDot: {
    // Dynamic styles applied via style prop
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: hp('60%'),
    paddingBottom: hp('4%'),
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: hp('2.2%'),
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  sourceList: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
  },
  sourceItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    marginVertical: hp('0.5%'),
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
  },
  sourceItemSelected: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  sourceItemDisabled: {
    opacity: 0.5,
  },
  sourceItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sourceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sourceItemName: {
    color: '#FFF',
    fontSize: hp('2%'),
    fontWeight: '500',
  },
  sourceItemNameSelected: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  sourceItemNameDisabled: {
    color: '#888',
  },
  disabledLabel: {
    color: '#F44336',
    fontSize: hp('1.4%'),
    marginTop: 4,
    marginLeft: 22,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: hp('1%'),
  },
  legendTitle: {
    color: '#888',
    fontSize: hp('1.5%'),
    fontWeight: '500',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    color: '#888',
    fontSize: hp('1.4%'),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('5%'),
  },
  emptyText: {
    color: '#666',
    fontSize: hp('1.8%'),
    marginTop: hp('1%'),
  },
});

export default SourceSelector;
