import React from 'react';
import { useSelector } from 'react-redux';
import { View, Text, StyleSheet } from 'react-native';
import HomeRenderItem from '../../../Components/UIComp/HomeRenderItem';
import GridList from '../../../Components/UIComp/GridList';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { heightPercentageToDP } from 'react-native-responsive-screen';
export function ComicHistory({ navigation }) {
    const History = useSelector(state => state.data.history);

    return (
        <GridList
            data={Object.values(History)}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
                <HomeRenderItem
                    item={item}
                    index={index}
                    key={index}
                    Showhistory={true}
                />
            )}
            ListEmptyComponent={() => (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: heightPercentageToDP('80%'),
                    }}>
                    <MaterialIcons name="history-toggle-off" size={heightPercentageToDP("10%")} color="gold" />
                    <Text style={[styles.title, { marginTop: 12 }]}>No History Found</Text>
                </View>
            )}
        />
    );
}

const styles = StyleSheet.create({
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
});