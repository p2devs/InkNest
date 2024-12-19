

import React, { useState, useEffect } from 'react';
import { FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchManga } from '../APIs';
import { NAVIGATION } from '../../../Constants';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { heightPercentageToDP } from 'react-native-responsive-screen';
import LoadingModal from '../../../Components/UIComp/LoadingModal';
import { PaginationButton } from '../Components';

export function MangaSearch({ navigation }) {
    const [searchData, setSearchData] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (page) => {
        if (!searchQuery || loading || page < 1 || page > searchData?.pagination?.totalPages) {
            return;
        }
        searchManga(searchQuery, page, setSearchData, setLoading);
    };

    const listFooter = () => {
        if (!searchData?.pagination?.totalPages) return null;

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

                {searchData?.pagination?.currentPage <= 1 ? <View /> :
                    <PaginationButton
                        label="Previous"
                        iconName="left"
                        onPress={() => {
                            handleSubmit(searchData?.pagination?.currentPage - 1);
                        }}
                    />
                }

                <Text
                    onPress={() => {
                        handleSubmit(searchData?.pagination?.totalPages);
                    }}
                    style={{
                        fontSize: heightPercentageToDP('2.4%'),
                        fontWeight: 'bold',
                        color: 'silver',
                    }}>
                    {searchData?.pagination?.currentPage} / {searchData?.pagination?.totalPages}
                </Text>

                {searchData?.pagination?.currentPage === searchData?.pagination?.totalPages ? <View /> :
                    <PaginationButton
                        label="Next"
                        iconName="right"
                        isIconPostionRight
                        onPress={() => {
                            handleSubmit(searchData?.pagination?.currentPage + 1);

                        }}
                    />
                }
            </View>
        )
    }
    const listHeader = () => {
        return (
            <Text Text style={{ fontWeight: "bold", padding: 5 }}>Total Results {searchData?.pagination?.totalResults ?? searchData?.searchlist?.length}</Text>
        )
    }
    const emptyList = () => {
        return (
            <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <Text>No data found</Text>
            </View>
        )
    }
    const card = ({ item }) => {
        return (
            <TouchableOpacity
                onPress={() => navigation.navigate(NAVIGATION.mangaDetails, { link: item.link, title: item.title })}
                style={{ padding: 10, flexDirection: "row", borderWidth: 0.5, borderColor: 'gray', margin: 10, }}>
                <Image
                    source={{ uri: item.image }}
                    style={{ width: 100, height: 100, borderRadius: 5, marginRight: 10 }}
                />
                <View style={{ gap: 3, flexWrap: 'wrap', width: '95%' }}>
                    <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", width: "80%" }}>
                        <Text>{item?.author}{" |"}</Text>
                        <Text>{item?.updated}</Text>
                    </View>
                    <Text
                        style={{ width: "78%", flexWrap: "wrap" }}
                    >{item.title}</Text>
                    {item?.chapterLinks &&
                        item?.chapterLinks.map(chapter => (
                            <Text
                                onPress={() => navigation.navigate(NAVIGATION.mangaBook, { title: item.title, link: chapter.chapterLink })}
                                style={{ color: 'blue', width: "70%", flexWrap: "wrap" }}
                                numberOfLines={1}
                                key={chapter.chapterLink}
                            >
                                {chapter.chapterName}
                            </Text>
                        ))
                    }
                </View>
            </TouchableOpacity>
        )
    }

    if (loading) return <LoadingModal loading={loading} />

    return (
        <SafeAreaView style={{ flex: 1, }} edges={['top']}>
            <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Search</Text>
            </View>
            <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search"
                onSubmitEditing={handleSubmit}
                style={{ padding: 10, margin: 10, borderWidth: 1, borderColor: 'gray' }}
            />
            {(!searchQuery || !searchData?.searchlist) ? null :
                <FlatList
                    data={searchData?.searchlist}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={emptyList}
                    renderItem={card}
                    ListHeaderComponent={listHeader}
                    ListFooterComponent={listFooter}
                />
            }
        </SafeAreaView >
    );
}

export default MangaSearch;
