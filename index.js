/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import messaging from '@react-native-firebase/messaging';
import crashlytics from '@react-native-firebase/crashlytics';
import {
	appendNotificationToStorage,
	buildNotificationPayload,
} from './src/Utils/notificationHelpers';

AppRegistry.registerComponent(appName, () => App);

messaging().setBackgroundMessageHandler(async remoteMessage => {
	try {
		const payload = buildNotificationPayload(remoteMessage, false);
		if (payload) {
			await appendNotificationToStorage(payload);
		}
	} catch (error) {
		crashlytics().recordError(error);
	}
});
