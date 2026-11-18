import React, {useState} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';

export default function PageImage({uri, index, sourceName, style, ...props}) {
  const [failedUri, setFailedUri] = useState(null);

  if (failedUri === uri) {
    return (
      <View style={[style, styles.unavailable]}>
        <Text style={styles.message}>
          Page {index + 1} couldn’t load.{'\n'}
          {sourceName} may be having trouble serving this page. InkNest has no
          control over its availability.
        </Text>
      </View>
    );
  }

  return (
    <Image
      {...props}
      source={{uri}}
      style={style}
      onError={() => setFailedUri(uri)}
    />
  );
}

const styles = StyleSheet.create({
  unavailable: {justifyContent: 'center', alignItems: 'center'},
  message: {
    maxWidth: '90%',
    textAlign: 'center',
    color: '#fff',
    backgroundColor: '#252536',
    padding: 12,
    borderRadius: 8,
  },
});
