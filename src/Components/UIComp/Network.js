import React from 'react';
import {View, Text} from 'react-native';
import {View as MView} from 'moti';
const _size = 80;
const _border = Math.round(_size / 10);
export default function Network() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
      }}>
      <View
        style={{
          width: '80%',
          height: '40%',
          borderWidth: 1,
          borderColor: 'white',
          alignItems: 'center',
          borderRadius: 12,
          justifyContent: 'center',
        }}>
        <MView
          from={{
            borderWidth: 0,
            width: _size,
            height: _size,
          }}
          animate={{
            borderWidth: _border,
            width: _size + 12,
            height: _size + 12,
          }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true,
          }}
          style={{
            width: _size,
            height: _size,
            borderRadius: _size,
            borderWidth: _border,
            borderColor: '#fff',
          }}
        />

        <Text style={{color: '#fff', fontSize: 20, marginTop: 20}}>
          Checking Network...
        </Text>
      </View>
    </View>
  );
}
