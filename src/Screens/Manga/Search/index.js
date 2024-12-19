

import React, { useState, useEffect } from 'react';
import { FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import APICaller from '../../../Redux/Controller/Interceptor';
import cheerio from 'cheerio';
import { NAVIGATION } from '../../../Constants';
import axios from 'axios';

export function MangaSearch({ navigation }) {
    const [data, setData] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    const getData = async () => {
        try {
            const response = await axios.get(`https://manganato.com/search/story/${searchQuery.replaceAll(/[^a-zA-Z0-9]/g, "_")}`);

            const html = response.data;

            const $ = cheerio.load(html);

            const searchResults = {};

            // Extract search story items (manga details)
            const mangaList = [];
            $('.search-story-item').each((i, elem) => {
                const mangaItem = {};
                const imgElement = $(elem).find('.item-img');
                mangaItem.title = $(elem).find('.item-title').text().trim();
                mangaItem.link = imgElement.attr('href');
                mangaItem.image = imgElement.find('img').attr('src');
                mangaItem.rating = parseFloat($(elem).find('.item-rate').text().trim());
                mangaItem.author = $(elem).find('.item-author').text().trim();
                mangaItem.updated = $(elem).find('.item-time').first().text().replace('Updated : ', '').trim();
                mangaItem.views = $(elem).find('.item-time').last().text().replace('View : ', '').trim();
                mangaItem.chapterLinks = [];

                $(elem).find('.item-chapter').each((j, chapterElem) => {
                    mangaItem.chapterLinks.push({
                        chapterName: $(chapterElem).text().trim(),
                        chapterLink: $(chapterElem).attr('href')
                    });
                });

                mangaList.push(mangaItem);
            });

            searchResults.searchlist = mangaList;

            // Extract pagination data (page numbers)
            const pagination = {};
            pagination.currentPage = $('.page-blue.page-last').prev().text();
            pagination.totalPages = parseInt($('.page-blue.page-last').text().replace('LAST(', '').replace(')', ''));
            pagination.firstPageUrl = $('.page-blue').first().attr('href');
            pagination.lastPageUrl = $('.page-blue.page-last').attr('href');

            searchResults.pagination = pagination;

            // Extract total results count
            searchResults.totalResults = parseInt($('.group-qty .page-blue').text().replace('TOTAL : ', '').trim());

            setData(searchResults);

            return searchResults;

        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Search</Text>
            </View>
            <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search"
                onSubmitEditing={getData}
                style={{ padding: 10, margin: 10, borderWidth: 1, borderColor: 'gray' }}
            />
            <FlatList
                data={data?.searchlist}
                keyExtractor={item => item.url_story}
                renderItem={({ item }) => {
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
                }}
            />
        </SafeAreaView>
    );
}

export default MangaSearch;
