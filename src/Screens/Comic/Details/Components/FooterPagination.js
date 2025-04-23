import {View} from 'moti';
import {StyleSheet, TouchableOpacity} from 'react-native';
import {NAVIGATION} from '../../../../Constants';
import {Text} from 'react-native-gesture-handler';

const PaginationFooter = ({pagination, pageLink, route, navigation}) => {
  if (!pagination || pagination.length === 0) return null;

  const handlePageChange = link => {
    // Extract the base URL correctly - keep everything before the last path segment
    const urlParts = pageLink.split('/');
    const baseUrl = urlParts.slice(0, -1).join('/');
    
    // Construct the full URL by combining the base URL with the pagination link
    // If link already has domain, use it as is
    const fullUrl = link.startsWith('http') 
      ? link 
      : `${baseUrl}/${link}`;
    
    console.log('Full URL:', fullUrl);
    
    // Navigate to the same screen with the updated URL
    navigation.push(NAVIGATION.comicDetails, {
      ...route?.params,
      link: fullUrl,
    });
  };

  return (
    <View style={styles.paginationContainer}>
      {pagination.map((page, index) => (
        <TouchableOpacity
          key={`${page.text}-${index}`}
          style={styles.pageButton}
          onPress={() => handlePageChange(page.link)}>
          <Text style={styles.pageButtonText}>{page.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Add these styles
const styles = StyleSheet.create({
  // ...existing styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    flexWrap: 'wrap',
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  pageButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});

export default PaginationFooter;
