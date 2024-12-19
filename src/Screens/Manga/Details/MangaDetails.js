import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import APICaller from '../../../Redux/Controller/Interceptor';
import cheerio from 'cheerio';
import { NAVIGATION } from '../../../Constants';


export function MangaDetails({ navigation, route }) {
    const { title, link } = route.params;
    const [mangaDetails, setMangaDetails] = useState({});

    const fetchMangaDetails = async () => {

        try {
            // Fetch the HTML content from the website
            // type = "newest" | "topview"

            const response = await APICaller.get(`${link}`);


            const html = response.data;
            // console.log(html, 'response');
            // console.log(html, "html");

            // Load the HTML into Cheerio
            const $ = cheerio.load(html);

            const mangaDetails = {};

            // Extracting the image
            const image = $('.story-info-left .info-image img').attr('src');

            // Extracting the title
            const title = $('.story-info-right h1').text().trim();

            // Extracting the alternative title
            const alternativeTitle = $('.variations-tableInfo .table-value h2').text().trim();

            // Extracting authors
            const authors = [];
            $('.variations-tableInfo .table-value a').each((i, elem) => {
                authors.push($(elem).text().trim());
            });

            // Extracting the status (Ongoing, Completed, etc.)
            const status = $('.variations-tableInfo .table-value').first().next().text().trim();

            // Extracting genres
            const genres = [];
            $('.variations-tableInfo .table-value a').each((i, elem) => {
                genres.push($(elem).text().trim());
            });

            // Extracting the description
            const description = $('.panel-story-info-description').text().trim();

            // Extracting the last updated time
            const lastUpdated = $('.story-info-right-extent .stre-value').first().text().trim();

            // Extracting the views count
            const views = $('.story-info-right-extent .stre-value').eq(1).text().trim();

            // Extracting the rating
            const rating = $('.rate_row .rate_star').length;

            // Pushing everything into the mangaDetails object
            mangaDetails.image = image;
            mangaDetails.title = title;
            mangaDetails.alternativeTitle = alternativeTitle;
            mangaDetails.authors = authors;
            mangaDetails.status = status;
            mangaDetails.genres = genres;
            mangaDetails.description = description;
            mangaDetails.lastUpdated = lastUpdated;
            mangaDetails.views = views;
            mangaDetails.rating = rating;

            // Extracting chapter list
            const chapters = [];
            $('.panel-story-chapter-list .row-content-chapter li').each((i, elem) => {
                const chapter = {};
                chapter.title = $(elem).find('.chapter-name').text().trim();
                chapter.link = $(elem).find('.chapter-name').attr('href');
                chapter.views = $(elem).find('.chapter-view').text().trim();
                chapter.uploadTime = $(elem).find('.chapter-time').attr('title');
                chapters.push(chapter);
            });

            mangaDetails.chapters = chapters;

            console.log(mangaDetails);
            setMangaDetails(mangaDetails);
            return mangaDetails;

        } catch (error) {
            console.error('Error fetching manga details:', error);
        }
    }

    useEffect(() => {
        fetchMangaDetails();

    }, []);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#222' }} edges={['top']}>
            <View style={{ backgroundColor: "#fff", flex: 1 }}>
                <Text>{title}</Text>
                <Text>{link}</Text>
                <View style={{ margin: 12, backgroundColor: "gold" }}>
                    <Text>Details</Text>
                    <Text>{mangaDetails?.alternativeTitle}</Text>
                    <Text>{mangaDetails?.authors?.join(', ')}</Text>
                    <Text>{mangaDetails?.status}</Text>
                    <Text>{mangaDetails?.genres?.join(', ')}</Text>
                    {/* <Text>{mangaDetails?.description}</Text> */}
                    <Text>{mangaDetails?.lastUpdated}</Text>
                    <Text>{mangaDetails?.views}</Text>
                    <Text>{mangaDetails?.rating}</Text>
                </View>
                <FlatList
                    data={mangaDetails?.chapters}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => navigation.navigate(NAVIGATION.mangaBook, { title: item.title, link: item.link })}
                            style={{ margin: 12, backgroundColor: "silver" }}>
                            <Text>{item.title}</Text>
                            <Text>{item.link}</Text>
                            <Text>{item.views}</Text>
                            <Text>{item.uploadTime}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </SafeAreaView >
    );
}
