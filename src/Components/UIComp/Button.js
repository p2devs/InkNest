import React from "react";
import { TouchableOpacity, Text } from "react-native";

const Button = ({ title, onPress, color = "#007AFF", textSize = 16, children }) => {
    return (
        <TouchableOpacity style={{ padding: 5 }} onPress={onPress}>
            {
                children ?
                    children
                    :
                    <Text style={{ color, fontSize: textSize }}>{title}</Text>
            }
        </TouchableOpacity>
    )
}

export default Button;