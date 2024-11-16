import React from "react";
import { 
    View,
    Text,
    StyleSheet
} from "react-native";

const OffileComic = (props) => (
    <View style={styles.container}>
        <Text>OffileComic</Text>
    </View>
    )
export default OffileComic;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
});