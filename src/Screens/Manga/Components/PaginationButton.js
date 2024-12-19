import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { heightPercentageToDP } from "react-native-responsive-screen";
import AntDesign from "react-native-vector-icons/AntDesign";

export const PaginationButton = ({ label, iconName, isIconPostionRight, onPress, color }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{ flexDirection: isIconPostionRight ? 'row-reverse' : 'row', gap: 2, justifyContent: "center", alignItems: "center" }}>
            <AntDesign name={iconName} size={24} color={color || "#222"} />
            <Text
                style={{
                    fontSize: heightPercentageToDP('2.4%'),
                    fontWeight: 'bold',
                    color: color || '#222',
                }}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};