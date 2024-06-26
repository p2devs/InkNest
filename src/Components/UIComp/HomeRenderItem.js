import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { navigate } from "../../Navigation/NavigationService";
import { NAVIGATION } from "../../Constants";
import Image from "./Image";
import { BlurView } from "@react-native-community/blur";

const HomeRenderItem = ({ item, index, Showhistory }) => {
    let Tag = Platform.OS === 'ios' ? BlurView : View;

    const [showItem, setShowItem] = useState(true);
    if (!showItem) return null;
    return (
        <View
            key={index}
            style={{
                flex: 1,
                alignItems: 'center',
            }}>
            <TouchableOpacity
                style={{
                    marginVertical: 5,
                    marginHorizontal: 5,
                    width: 180,
                    height: 180,
                    borderRadius: 10,
                    flexWrap: 'wrap',
                }}
                onPress={async () => {
                    if (item.episode) {
                        navigate(NAVIGATION.animeVideo, {
                            link: item.link,
                            title: item.title,
                        });
                        return;
                    }
                    navigate(NAVIGATION.comicDetails, {
                        link: item.link,
                        home: !Showhistory,
                        search: Showhistory,
                        PageUrl: item.link,
                    });
                }
                }>
                <Image
                    source={{ uri: item.imageUrl }}
                    style={{
                        width: 180,
                        height: 180,
                    }}
                    onFailer={() => {
                        console.log('Image Load Failed');
                        setShowItem(false);
                    }}

                />
                <Tag
                    intensity={10}
                    tint="light"
                    style={[
                        {
                            padding: 10,
                            justifyContent: 'space-between',
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            minHeight: '20%',
                            flex: 1,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                        },
                    ]}>
                    <Text
                        style={{ color: 'white', fontWeight: '700', fontSize: 14 }}
                        numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={{ color: 'white', width: '80%' }} numberOfLines={1}>
                        {item?.episode ? item?.episode : item?.genres ? item?.genres.join(',') : item.date}
                    </Text>
                </Tag>
            </TouchableOpacity>
        </View>
    )
}

export default HomeRenderItem;