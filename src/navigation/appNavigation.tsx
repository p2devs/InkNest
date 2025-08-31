import { createStackNavigator } from '@react-navigation/stack';

import { NAVIGATION } from '../constants';
import type { RootParamList } from '../constants';
import { ComicHome } from '../screens';

const Stack = createStackNavigator<RootParamList>();

export function AppNavigation() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={NAVIGATION.home} component={ComicHome} />
    </Stack.Navigator>
  );
}
