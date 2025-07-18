import axios from "axios";
import APICaller from "../../Redux/Controller/Interceptor";
import { Alert, Linking, Modal, View } from "react-native";

// Conditional imports for macOS compatibility
import { isMacOS } from '../../Utils/PlatformUtils';

// Device info - only import on supported platforms
let DeviceInfo;
if (!isMacOS) {
  DeviceInfo = require('react-native-device-info').default;
}

export const getReleases = async (setLogs = null, navigation = null) => {
    try {
        let response = await APICaller.get('https://api.github.com/repos/p2devs/InkNest/releases')

        if (setLogs) {
            setLogs(response?.data);
        }

        return response?.data
    } catch (error) {

        if (navigation) {
            navigation.goBack();
        }

        return null;
    }
}
