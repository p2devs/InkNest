import React from 'react';
import { useSelector } from 'react-redux';
import { View, Text, StyleSheet } from 'react-native';
import HomeRenderItem from '../../../Components/UIComp/HomeRenderItem';
import GridList from '../../../Components/UIComp/GridList';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { heightPercentageToDP } from 'react-native-responsive-screen';
export function Watched({ navigation }) {
    const AnimeWatched = useSelector(state => state.data.AnimeWatched);
    const baseUrl = useSelector(state => state.data.baseUrl);

    return (
        <GridList
            data={Object.values(AnimeWatched).filter(el => el.AnimeName.includes(`-${baseUrl}`)).sort((a, b) => b.watchTime - a.watchTime)}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => {
                return (
                    <HomeRenderItem
                        item={{
                            title: item?.AnimeName.split(`-${baseUrl}`)[0],
                            episode: item?.ActiveEpisdoe,
                            imageUrl: item.imageUrl,
                            link: item.ActiveEpisdeLink,
                            Progress: (item?.ActiveEpisdoeProgress / item?.ActiveEpisdoeDuration) * 100,
                        }}
                        index={index}
                        key={index}
                        Showhistory={false}
                        search={Boolean(item?.date)}
                    />
                )
            }}
            ListEmptyComponent={() => (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: heightPercentageToDP('80%'),
                    }}>
                    <MaterialIcons name="history-toggle-off" size={heightPercentageToDP("10%")} color="gold" />
                    <Text style={[styles.title, { marginTop: 12 }]}>No Watched Found</Text>
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