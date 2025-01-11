import React from "react";
import { View, Text, StyleSheet } from "react-native";

const DescriptionView = ({ vol, index }) => {
    if (!vol?.volume) {
        return null;
    }
    return (
        <React.Fragment key={index}>

            <Text style={styles.description}><Text style={styles.label}>{vol.volume}:</Text> {vol.description}</Text>
        </React.Fragment>
    );
}

const styles = StyleSheet.create({
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    description: {
        fontSize: 12,
        marginBottom: 10,
        color: 'rgba(255, 255, 255, 0.5)',

    },
});

export default DescriptionView;