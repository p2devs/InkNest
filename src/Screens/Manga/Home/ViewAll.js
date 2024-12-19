import React, { useRef, useState } from 'react';
import {
    Text,
    View,
    TouchableOpacity,
    FlatList,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LoadingModal from '../../../Components/UIComp/LoadingModal';
import {
    heightPercentageToDP,
    widthPercentageToDP,
} from 'react-native-responsive-screen';
import Header from '../../../Components/UIComp/Header';
import GridList from '../../../Components/UIComp/GridList';
import { ViewAllCard } from './Components/Card';
import { getManga } from '../APIs';
import { PaginationButton } from '../Components';

export function MangaViewAll({ navigation, route }) {

    const { LoadedData, type, title } = route.params;
    const [loading, setLoading] = useState(false);
    const [mangaData, setMangaData] = useState(LoadedData);

    const getNetPrevPage = async (page) => {
        //reject if page is less then 1 and greater then total pages
        try {
            if (loading || !page || page < 1 || page > mangaData?.pagination?.totalPages || page === mangaData?.pagination?.currentPage) {
                return;
            }
            setLoading(true);
            const res = await getManga(page, type === 'latest' ? null : type);
            setMangaData(res);
            setLoading(false);

        } catch (error) {
            console.error('Error fetching manga data:', error);
            Alert.alert('something went wrong please try again!');
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }} edges={['top']}>
                <View style={{ backgroundColor: "#fff", flex: 1 }}>
                    <LoadingModal loading={loading} />
                </View>
            </SafeAreaView>
        )
    }

    if (!mangaData && !loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }} edges={['top']}>
                <View style={{ backgroundColor: "#fff", flex: 1 }}>
                    <Text>Error fetching manga data</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }} edges={['top']}>

            <View
                style={{
                    flex: 1,
                }}>
                <Header
                    style={{
                        width: '100%',
                        height: heightPercentageToDP('5%'),
                        backgroundColor: '#222',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingHorizontal: 12,
                        borderBottomColor: '#fff',
                        borderBottomWidth: 0.5,
                        marginBottom: 5,
                    }}>
                    <TouchableOpacity
                        onPress={() => {
                            navigation.goBack();
                        }}
                        style={{ flexDirection: 'row', gap: 12, justifyContent: "center", alignItems: "center" }}>
                        <AntDesign name="left" size={24} color="#fff" />
                        <Text
                            style={{
                                fontSize: heightPercentageToDP('2.4%'),
                                fontWeight: 'bold',
                                color: '#FFF',
                            }}>
                            {String(title)?.toUpperCase()} MANGA
                        </Text>
                    </TouchableOpacity>
                    <View />
                </Header>
                <FlatList
                    data={mangaData?.mangaList}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={ViewAllCard}
                    ListFooterComponent={() => {
                        return (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginTop: 12,
                                    justifyContent: 'space-between',
                                    paddingHorizontal: 12,
                                    marginBottom: 12
                                }}>

                                {mangaData?.pagination?.currentPage <= 1 ? <View /> :
                                    <PaginationButton
                                        label="Previous"
                                        iconName="left"
                                        color={"#fff"}
                                        onPress={() => {
                                            getNetPrevPage(mangaData?.pagination?.currentPage - 1);
                                        }}
                                    />}

                                <Text
                                    onPress={() => {
                                        getNetPrevPage(mangaData?.pagination?.totalPages);
                                    }}
                                    style={{
                                        fontSize: heightPercentageToDP('2.4%'),
                                        fontWeight: 'bold',
                                        color: 'silver',
                                    }}>
                                    {mangaData?.pagination?.currentPage} / {mangaData?.pagination?.totalPages}
                                </Text>

                                {mangaData?.pagination?.currentPage === mangaData?.pagination?.totalPages ? <View /> :
                                    <PaginationButton
                                        label="Next"
                                        iconName="right"
                                        isIconPostionRight
                                        color={"#fff"}
                                        onPress={() => {
                                            getNetPrevPage(mangaData?.pagination?.currentPage + 1);
                                        }}
                                    />}
                            </View>
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
                            <Text style={[styles.title, { marginTop: 12 }]}>No {String(title)?.toUpperCase()} Found</Text>
                        </View>
                    )}
                />
                <LoadingModal loading={loading} />
            </View>
        </SafeAreaView >
    );
}
