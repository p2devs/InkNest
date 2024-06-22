import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchComicsData } from "../Func/HomeFunc";
import Button from "./Button";

const DownTime = () => {
    const dispatch = useDispatch();
    const loading = useSelector(state => state.data.loading);
    return (
        <View style={styles.container} >
            {loading ?
                <Text style={styles.title}>Checking server...</Text>
                : <Text style={styles.title}>Server is down for maintenance</Text>}
            {loading ?
                <ActivityIndicator size="large" color="#fff" />
                :
                <Button
                    title="Retry"
                    onPress={() => {
                        fetchComicsData(`https://readallcomics.com/`, dispatch);
                    }}
                    textSize={20}
                />}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#222',
        justifyContent: "center",
        alignItems: "center",
        gap: 15,
        paddingHorizontal: 20
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    }
})

export default DownTime;