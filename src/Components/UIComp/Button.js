import React from "react";
import { TouchableOpacity, Text } from "react-native";

const Button = ({ title, onPress, color = "#007AFF",textSize=16 }) => {
    return (
        <TouchableOpacity style={{ padding: 5 }} onPress={onPress}>
            <Text style={{ color, fontSize: textSize }}>{title}</Text>
        </TouchableOpacity>
    )
}

export default Button;