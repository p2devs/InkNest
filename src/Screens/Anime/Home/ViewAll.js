import React, { useEffect, useRef, useState } from 'react';
import {
    Text,
    View,
    // Image,
    TouchableOpacity,
    FlatList,
    // Button,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Switch,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from '@react-native-community/blur';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { FetchAnimeData } from '../../../Components/Func/HomeFunc';
import LoadingModal from '../../../Components/UIComp/LoadingModal';
import {
    heightPercentageToDP,
    widthPercentageToDP,
} from 'react-native-responsive-screen';
import Button from '../../../Components/UIComp/Button';
import Header from '../../../Components/UIComp/Header';
import ErrorCard from '../../../Components/UIComp/ErrorCard';
import HomeRenderItem from '../../../Components/UIComp/HomeRenderItem';
import { AnimeHostName } from '../../../Utils/APIs';

export function ViewAll({ navigation, route }) {
    const { LoadedData, type, title, PageLink } = route.params;
    const dispatch = useDispatch();
    const error = useSelector(state => state.data.error);
    const baseUrl = useSelector(state => state.data.baseUrl);
    const flatListRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [AnimatedData, setAnimatedData] = useState({ data: LoadedData, page: 1 });
    const animatedCall = async (page) => {
        console.log('page', page);
        try {
            setLoading(true);
            let url = AnimeHostName[baseUrl] == AnimeHostName.gogoanimes ? (PageLink ? `${PageLink}?page=${page}` : `?page=${page}&type=${type}`) : `${type ? type : ""}?page=${page}`
            let res = await FetchAnimeData(url, dispatch, baseUrl);
            if (res.length == 0) {
                setLoading(false);
                alert('No Data Found');
                return;
            }
            setAnimatedData({
                data: res,
                page: page,
            });
            setLoading(false);
            // setPage(page);
            if (flatListRef?.current)
                flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
        } catch (error) {
            console.log(error, 'error in home page');
            setLoading(false);
            return;
        }
    };
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
                            {title}
                        </Text>
                    </TouchableOpacity>
                </Header>
                {!loading && !AnimatedData?.data?.length && error ? (
                    <View
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#000',
                        }}>
                        <ErrorCard
                            error={error}
                            ButtonText="Reload"
                            onPress={() => {
                                loadComics({ next: true });
                            }}
                        />
                    </View>
                ) : (
                    <FlatList
                        refreshing={loading}
                        onRefresh={() => {
                            animatedCall(AnimatedData.page);
                        }}
                        
                        ref={flatListRef}
                        numColumns={2}
                        key={2}
                        showsVerticalScrollIndicator={false}
                        style={{
                            flex: 1,
                            backgroundColor: '#000',
                        }}
                        data={AnimatedData?.data}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item, index }) => (
                            <HomeRenderItem
                                item={item}
                                index={index}
                                key={index}
                                Showhistory={false}
                            />
                        )}
                        ListFooterComponent={() => {
                            return (
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginVertical: heightPercentageToDP('1%'),
                                        marginBottom: heightPercentageToDP('2%'),
                                        paddingHorizontal: 12
                                    }}>
                                    <Button
                                        title="Previous"
                                        onPress={() => {
                                            if (AnimatedData.page > 1) {
                                                animatedCall(AnimatedData.page - 1);
                                                return;
                                            }
                                        }}
                                        disabled={[0, 1].includes(AnimatedData.page)}
                                    />
                                    <Text
                                        style={{
                                            color: 'white',
                                        }}>
                                        Page {String(AnimatedData.page)}
                                    </Text>
                                    <Button
                                        title="Next"
                                        onPress={() => {
                                            animatedCall(AnimatedData.page + 1);
                                        }}
                                    />
                                </View>
                            );
                        }}
                    />
                )}

                <LoadingModal loading={loading} />
            </View>
        </SafeAreaView>
    );
}
