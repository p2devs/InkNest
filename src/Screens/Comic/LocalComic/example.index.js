import React, { Component } from "react";
import { 
    View,
    Text,
    StyleSheet
} from "react-native";

class LocalComic extends Component {
    render() {
        return (
            <View style={styles.container}>
                <Text>LocalComic</Text>
            </View>
        );
    }
}
export default LocalComic;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
});