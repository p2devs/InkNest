import React from "react";
import { View, Text, StyleSheet } from "react-native";

const DescriptionView = ({ vol, index }) => {
    if (!vol?.volume) {
        return null;
    }
    return (
        <React.Fragment key={index}>
            <Text style={styles.volume}><Text style={styles.label}>{vol.volume}:</Text> {vol.description}</Text>
        </React.Fragment>
    );
}

const styles = StyleSheet.create({
    label: {
        fontWeight: 'bold',
    },
    volume: {
        fontSize: 16,
        marginBottom: 10,
    },
});

export default DescriptionView;