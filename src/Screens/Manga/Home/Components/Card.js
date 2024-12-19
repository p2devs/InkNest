import { Text, View, TouchableOpacity, Image } from 'react-native'
import { navigate } from '../../../../Navigation/NavigationService'
import { NAVIGATION } from '../../../../Constants'
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen'

export const HomeCard = ({ item }) => {
    return (
        <TouchableOpacity
            onPress={() => navigate(NAVIGATION.mangaDetails, { link: item.link, title: item.title })}
            style={{ margin: 10, backgroundColor: '#2f2', width: 250, height: 250, padding: 5 }}>
            <Image
                source={{ uri: item.image }}
                style={{
                    width: widthPercentageToDP('40%'),
                    height: heightPercentageToDP('20%'),
                    borderRadius: 10,
                }}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <Text>{item.author}</Text>
                <Text>{item.rating}</Text>
                <Text>{item.releaseDate}</Text>
            </View>
            <Text>{item.title}</Text>
            {item.Chapter ? <Text>{item.Chapter.title}</Text> : null}
        </TouchableOpacity>
    )
}

export const ViewAllCard = ({ item }) => {
    return (
        <TouchableOpacity
            onPress={() => navigate(NAVIGATION.mangaDetails, { link: item.link, title: item.title })}
            style={{ margin: 10, backgroundColor: 'silver', padding: 5, flexDirection: "row", gap: 12, borderWidth: 1, borderColor: "gold", borderRadius: 10, }}>
            <Image
                source={{ uri: item.image }}
                style={{
                    width: widthPercentageToDP('30%'),
                    height: heightPercentageToDP('25%'),
                    borderRadius: 10,
                }}
            />
            <View style={{ flexDirection: 'column', gap: 12, }}>
                <Text style={{ fontWeight: 'bold', flexWrap: 'wrap', width: widthPercentageToDP("60%") }}>{item.title}</Text>
                {/* <View style={{ flexDirection: 'row', gap: 4 }}> */}
                <Text>{item.author}</Text>
                <Text>{item.rating}</Text>
                <Text>{item.releaseDate}</Text>
                {/* </View> */}
                {item.Chapter ?
                    <Text
                        style={{ color: "blue", flexWrap: 'wrap', width: widthPercentageToDP("60%") }}
                        numberOfLines={2}
                        onPress={() => navigate(NAVIGATION.mangaBook, { link: item.Chapter.link, title: item.Chapter.title })}>
                        {item.Chapter.title}
                    </Text>
                    :
                    null}
            </View>
        </TouchableOpacity>
    )
}