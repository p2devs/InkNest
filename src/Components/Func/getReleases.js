import axios from "axios";
import APICaller from "../../Redux/Controller/Interceptor";
import { Alert, Linking, Modal, View } from "react-native";
import DeviceInfo from "react-native-device-info";

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
