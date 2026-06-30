declare module 'react-native-vector-icons/MaterialCommunityIcons' {
  import {ComponentType} from 'react';
  import {StyleProp, TextStyle} from 'react-native';

  export interface MaterialCommunityIconsProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
    onPress?: () => void;
  }

  const MaterialCommunityIcons: ComponentType<MaterialCommunityIconsProps>;
  export default MaterialCommunityIcons;
}
