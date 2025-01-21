import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

const Header = ({ title, children, style, TitleStyle }) => {

    return (
        <View style={[styles.container, style]}>
            {children ?? <Text style={[styles.title, TitleStyle]}>{title}</Text>}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: hp('4%'),
        backgroundColor: '#14142A',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderBottomColor: '#fff',
        borderBottomWidth: 0.5,
        marginBottom: 5
    },
    title: {
        fontSize: hp('2%'),
        fontWeight: 'bold',
        color: '#FFF',
    }
})

export default Header;