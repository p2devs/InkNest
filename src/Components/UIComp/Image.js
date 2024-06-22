import React, { useState } from "react";
import { ActivityIndicator, Image as Img, Platform, Text, View } from "react-native";
import { FasterImageView, clearCache } from '@candlefinance/faster-image';


const Image = ({ source, style, onFailer, resizeMode = null, onSuccess = null, ...rest }) => {
    const [loading, setLoading] = useState(true);
    return (
        <View style={[style]}>
            <FasterImageView
                {...rest}
                style={style}
                // source={source?.priority ? source :
                //     {
                //         uri: source.uri,
                //         priority: FastImage.priority.high,
                //     }}
                source={{
                    activityColor: "gold",
                    transitionDuration: 0.3,
                    resizeMode: resizeMode ?? "fill",
                    cachePolicy: 'discWithCacheControl',
                    showActivityIndicator: true,
                    url: source.uri,
                    progressiveLoadingEnabled: true,
                    allowHardware: true,
                }}
                onSuccess={(event) => {
                    setLoading(false);
                    // console.log("Image Loaded", Platform.OS);
                    if (onSuccess) onSuccess(event);
                }}
                onError={(event) => {
                    setLoading(false);
                    // console.log("Image Load Failed", Platform.OS);
                    if (onFailer) {
                        onFailer(event);
                    }
                }}

            />
            {/* {(loading) ?
                <View style={{ position: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="gold" />
                </View>
                : null
            } */}

        </View>
    )
}

export default Image;