import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Button from "./Button";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

const ErrorCard = ({ error = "Oops!! something went wrong", style, Textstyle, onPress, ButtonText = "Reload", ButtonColor = "#007AFF", ButtonTextSize = 20 }) => {
    const Tag = View;
    return (
        <Tag
            intensity={20}
            tint="dark"
            style={[styles.container, style]}
        >
            <Text style={[styles.text, Textstyle]}>{error}</Text>
            {!onPress ? null :
                <Button
                    color={ButtonColor}
                    textSize={ButtonTextSize}
                    title={ButtonText}
                    onPress={onPress}
                />}
        </Tag>
    );
}

const styles = StyleSheet.create({
    container: {
        height: hp("30%"),
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignSelf: 'center',
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: 'red',
        borderRadius: 10,
    },
    text: {
        color: 'red',
        fontSize: 19,
        fontWeight: "600",
        textAlign: "center"
    },
});

export default ErrorCard;