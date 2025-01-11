import { getAnalytics } from "@react-native-firebase/analytics";
import React, { memo } from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { navigate } from "../../../Navigation/NavigationService";
import { NAVIGATION } from "../../../Constants";

const ChapterCard = ({ item, index, isBookmark }) => {
    const ComicBook = useSelector(state => state.data.dataByUrl[item.link]);
    const numbersBookmarks = ComicBook?.BookmarkPages?.length;

    const handleClick = async () => {
        await getAnalytics().logEvent('open_bookmark_comic', {
            link: item?.link?.toString(),
            title: item?.title?.toString(),
        });
        navigate(NAVIGATION.comicBook, {
            comicBookLink: item?.link,
        });
    }

    if (isBookmark && !numbersBookmarks) return null

    return (
        <TouchableOpacity
            key={index}
            style={{
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                height: 44,
                paddingHorizontal: 8,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
                marginHorizontal: 16,
            }}
            onPress={handleClick}>
            <Text
                style={{
                    color: '#eaebea',
                    fontSize: 14,
                }}>
                {item.title}
            </Text>
            {item?.date ?
                <Text
                    style={{
                        fontSize: 14,
                        color: '#4b4b5f',
                    }}>
                    {` · `}{item?.date}
                </Text>
                : null}
            {ComicBook ?
                <Text style={{ color: 'steelblue' }}>
                    {!isBookmark && (ComicBook?.lastReadPage + 1 > 1) ? ` · (${ComicBook?.lastReadPage + 1}/${ComicBook?.images.length})` : ''}

                    {isBookmark && numbersBookmarks ? ` · (${ComicBook?.BookmarkPages.map(item => item + 1).toString()})` : ''}
                </Text>
                :
                null}
        </ TouchableOpacity>
    )
}

export default memo(ChapterCard);