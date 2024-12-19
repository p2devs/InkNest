import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { NAVIGATION } from '../../../Constants';
import { getMangaDetails } from '../APIs';
import LoadingModal from '../../../Components/UIComp/LoadingModal';
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen';
import { Chip } from 'react-native-paper';


export function MangaDetails({ navigation, route }) {
    const { title, link } = route.params;
    const [mangaDetails, setMangaDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(0);
    const [isSort, setSorting] = useState(true);

    useEffect(() => {
        getMangaDetails(link, setMangaDetails, setLoading);
    }, []);

    const reverseChapterList = useMemo(() => {
        const getReversedList = chapterList => {
            if (!chapterList) return [];
            if (!isSort) return [...chapterList];
            return [...chapterList].reverse();
        };
        return getReversedList;
    }, [isSort]);

    if (loading) return <LoadingModal loading={loading} />

    if (!mangaDetails && !loading) {
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

            <View style={{ backgroundColor: "#fff", flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', padding: 12, borderBottomColor: '#222', borderBottomWidth: 0.5 }}>
                    <TouchableOpacity
                        onPress={() => setTab(0)}
                    >
                        <Text style={{ fontWeight: tab === 0 ? 'bold' : "400", color: tab === 0 ? 'skyblue' : '#222' }}>Information</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setTab(1)}
                    >
                        <Text style={{ fontWeight: tab === 1 ? 'bold' : "400", color: tab === 1 ? 'skyblue' : '#222' }}>Chapter</Text>
                    </TouchableOpacity>
                </View>

                {tab === 0 &&
                    <ScrollView style={{ margin: 12, gap: 12 }}>
                        <View style={{ flexDirection: "row" }}>
                            <View style={{ width: widthPercentageToDP('60%'), gap: 12 }}>
                                <Text style={{ fontWeight: "bold" }}>{title}</Text>
                                <Text style={{ fontWeight: "bold" }}>Alternative Title:  <Text style={{ fontWeight: "400" }}>{mangaDetails?.alternativeTitle}</Text></Text>
                                <Text style={{ fontWeight: "bold" }}>last Updated: <Text style={{ fontWeight: "400" }}> {mangaDetails?.lastUpdated}</Text> </Text>
                                {!mangaDetails?.status ? null : <Text style={{ fontWeight: "bold" }}>Status: <Text style={{ fontWeight: "400" }}>  {mangaDetails?.status}</Text> </Text>}
                            </View>

                            <Image
                                source={{
                                    uri: mangaDetails?.image,
                                    headers: {
                                        Referer: mangaDetails?.image,
                                    }
                                }}
                                style={{ width: 100, height: 150, margin: 12 }}
                            />
                        </View>

                        <Text style={{ fontWeight: "bold" }}>Authors:</Text>
                        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", marginBlock: 12 }}>
                            {
                                mangaDetails?.authors?.map((author, index) => (
                                    <Chip key={index} compact >{author}</Chip>
                                ))
                            }
                        </View>

                        <Text style={{ fontWeight: "bold" }}>Genres:</Text>
                        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", marginBlock: 12 }}>
                            {
                                mangaDetails?.genres?.map((genre, index) => (
                                    <Chip key={index} compact >{genre}</Chip>
                                ))
                            }
                        </View>
                        <Text style={{ fontWeight: "bold", marginBlock: 12 }}>Description:</Text>
                        {!mangaDetails?.description ? null : <Text>{mangaDetails?.description}</Text>}
                    </ScrollView>
                }

                {tab === 1 &&
                    <FlatList
                        data={reverseChapterList(mangaDetails?.chapters)}
                        keyExtractor={(item, index) => index.toString()}
                        ListHeaderComponent={
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", margin: 12 }}>
                                <Text style={{ fontWeight: "bold" }}>Total Chapters: <Text style={{ fontWeight: "400" }}> {mangaDetails?.chapters?.length}</Text> </Text>
                                <TouchableOpacity
                                    onPress={() => setSorting(!isSort)}
                                >
                                    <FontAwesome5
                                        name={`sort-numeric-down${!isSort ? '-alt' : ''}`}
                                        size={heightPercentageToDP('3%')}
                                        color={'#000'}
                                    />
                                </TouchableOpacity>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => navigation.navigate(NAVIGATION.mangaBook, { title: item.title, link: item.link })}
                                style={{ margin: 12, backgroundColor: "silver", padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={{ width: "60%", flexWrap: "wrap" }}>{item.title}</Text>
                                <Text>{item.uploadTime}</Text>
                            </TouchableOpacity>
                        )}
                    />}
            </View>
        </SafeAreaView >
    );
}
