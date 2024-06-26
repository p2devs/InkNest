import React, { useLayoutEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Linking } from "react-native";
import Header from "../../Components/UIComp/Header";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";
import { GetVideoLink } from "../../Components/Func/AnimeVideoFunc";
import Loading from "../../Components/UIComp/Loading";
import Error from "../../Components/UIComp/Error";
import Button from "../../Components/UIComp/Button";
import Video, { Orientation } from 'react-native-video';
import { NAVIGATION } from "../../Constants";




const AnimeVideo = ({ route, navigation }) => {
    const videoRef = useRef(null);
    const { link, title } = route.params;
    const dispatch = useDispatch();
    const [videoData, setVideoData] = useState({});
    const error = useSelector(state => state.data.error);
    const loading = useSelector(state => state.data.loading);
    const [serverLink, setServerLink] = useState(0);

    useLayoutEffect(() => {
        getData()
    }, []);

    const getData = async () => {
        try {
            const data = await GetVideoLink(link, dispatch);
            setVideoData(data);
        } catch (error) {
            console.log('Error fetching or parsing data AnimeVideo:', error);
        }
    }

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <SafeAreaView style={{ backgroundColor: "#000", flex: 1 }}>
                <Header
                    style={{
                        width: '100%',
                        height: hp('5%'),
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
                        }}>
                        <Ionicons
                            name="chevron-back"
                            size={hp('3%')}
                            color="#fff"
                            style={{ marginRight: 10 }}
                        />
                    </TouchableOpacity>
                    <Text
                        style={{
                            fontSize: hp('2%'),
                            fontWeight: 'bold',
                            color: '#FFF',
                            width: '50%',
                        }}
                        lineBreakMode="tail"
                        numberOfLines={1}
                    >
                        {title}
                    </Text>

                    <View
                        style={{
                            flex: 0.1,
                        }}
                    />
                </Header>

                <Error error={error} />
            </SafeAreaView>
        );
    }
    if (Object.keys(videoData).length === 0) {
        return <SafeAreaView style={{ backgroundColor: "#222", flex: 1 }}>
            <Header
                style={{
                    width: '100%',
                    height: hp('5%'),
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
                    }}>
                    <Ionicons
                        name="chevron-back"
                        size={hp('3%')}
                        color="#fff"
                        style={{ marginRight: 10 }}
                    />
                </TouchableOpacity>
                <Text
                    style={{
                        fontSize: hp('2%'),
                        fontWeight: 'bold',
                        color: '#FFF',
                        // width: '50%',
                    }}
                    lineBreakMode="tail"
                    numberOfLines={1}
                >
                    {title}
                </Text>

                <View
                    style={{
                        flex: 0.1,
                    }}
                />
            </Header>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "white", fontSize: 16 }}>No Data Found</Text>
            </View>
        </SafeAreaView>
    }
    // console.log(videoData?.servers);
    const onBuffer = (buffer) => {
        console.log(buffer);
    }
    const onError = (error) => {
        console.log(error);
    }
    return (
        <SafeAreaView style={{ backgroundColor: "#222", flex: 1 }}>
            <Header
                style={{
                    width: '100%',
                    height: hp('5%'),
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
                    }}>
                    <Ionicons
                        name="chevron-back"
                        size={hp('3%')}
                        color="#fff"
                        style={{ marginRight: 10 }}
                    />
                </TouchableOpacity>
                <Text
                    style={{
                        fontSize: hp('2%'),
                        fontWeight: 'bold',
                        color: '#FFF',
                        // width: '50%',
                    }}
                    lineBreakMode="tail"
                    numberOfLines={1}
                >
                    {title}
                </Text>

                <View
                    style={{
                        flex: 0.1,
                    }}
                />
            </Header>

            <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <View style={{ flexDirection: "column", gap: 13 }}>
                    <Text style={{ color: "gold", fontSize: 16 }}
                        onPress={() => {
                            navigation.replace(NAVIGATION.animeDetails, { link: videoData.animeInfo?.link, title: videoData.animeInfo?.title });
                        }}>
                        Anime Title: {videoData.animeInfo?.title}
                    </Text>
                    <Text style={{ color: "gold", fontSize: 16 }}>
                        Catagory: {videoData?.category?.title}
                    </Text>
                </View>

                <Button
                    title="Download"
                    onPress={() => {
                        Linking.openURL(videoData?.downloadLink);
                    }}
                />

                <Text style={{ fontSize: 14, color: "white", marginTop: 12 }}>Servers</Text>
                {
                    videoData?.servers?.map((server, index) => (
                        <Button
                            color={serverLink == index ? "gold" : "silver"}
                            key={index}
                            title={server.serverName}
                            onPress={() => {
                                setServerLink(index);
                            }}
                        />
                    ))
                }
                <Video
                    source={{ uri: videoData?.servers[serverLink]?.serverLink }}
                    ref={videoRef}
                    // Callback when remote video is buffering                                      
                    onBuffer={onBuffer}
                    // Callback when video cannot be loaded              
                    onError={onError}
                    style={styles.backgroundVideo}
                    controls={true}
                    paused={false}
                    onFullscreenPlayerWillPresent={() => {
                        //rotate screen
                        // Orientation.LANDSCAPE= "LANDSCAPE-LEFT"
                    }}
                    onFullscreenPlayerWillDismiss={() => {
                        //rotate screen
                        // Orientation.PORTRAIT= "PORTRAIT"

                    }}
                // resizeMode="contain"
                />

                <Text style={{ fontSize: 14, color: "white", marginTop: 12 }}> Episodes</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: 12, marginVertical: 12 }}>
                    {
                        //show handpicked of episodes range
                        videoData?.episodePages?.map((episode, index) => (
                            <TouchableOpacity key={index} >
                                <Text style={{ color: (episode.active || index == videoData?.episodePages.length - 1) ? "gold" : "white", textDecorationLine: (episode.active || index == videoData?.episodePages.length - 1) ? "underline" : "none", fontSize: 16 }}>
                                    {episode.epStart}-{episode.epEnd}
                                </Text>
                            </TouchableOpacity>
                        ))
                    }
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {
                        //show all episodes
                        videoData?.episodes?.map((episode, index) => (
                            <Button
                                color={episode.active ? "gold" : "silver"}
                                key={index}
                                title={episode.episodeNumber}
                                onPress={() => {
                                    // Linking.openURL(episode.episodeLink);
                                    navigation.replace(NAVIGATION.animeVideo, {
                                        link: episode.episodeLink,
                                        title: title
                                    });

                                }}
                            />
                        ))
                    }
                </View>
            </View>
        </SafeAreaView >
    );
}

var styles = StyleSheet.create({
    backgroundVideo: {
        width: "100%",
        height: 200,
        backgroundColor: "black"
    },
});
export default AnimeVideo;