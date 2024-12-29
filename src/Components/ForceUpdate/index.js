import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Modal,
    Linking
} from 'react-native';
import { checkUpdate } from './Func';

const ForceUpdate = () => {
    const [isForceUpdate, setIsForceUpdate] = useState(false);
    useEffect(() => {
        checkUpdate(setIsForceUpdate, handleUpdate)
    }, []);

    const handleUpdate = () => {
        Linking.openURL('https://p2devs.github.io/InkNest/');
    }

    return (
        <Modal visible={isForceUpdate} animationType="slide" transparent>
            <View style={styles.container}>
                <Image
                    source={{ uri: 'https://github.com/p2devs/InkNest/blob/main/.github/readme-images/icon.png?raw=true' }}
                    style={styles.image}
                />
                <Text style={styles.title}>Update Required</Text>
                <Text style={styles.message}>
                    A newer version of the app is available. Please update to continue using the app.
                </Text>
                <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                    <Text style={styles.updateButtonText}>Update Now</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    image: {
        width: 200,
        height: 200,
        marginBottom: 20,
        borderRadius: 20,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    updateButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    updateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ForceUpdate;