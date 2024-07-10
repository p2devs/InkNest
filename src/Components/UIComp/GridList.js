import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import { Dimensions, FlatList } from "react-native";

const GridList = forwardRef(({ ...rest }, ref) => {
    const flatListRef = useRef(null);
    const [numColumns, setNumColumns] = useState(2);

    useEffect(() => {
        const updateGrid = () => {
            const width = Dimensions.get('window').width;
            const newNumColumns = Math.floor(width / 150); // Adjust 150 to desired item width
            if (newNumColumns <= 2) {
                setNumColumns(newNumColumns);
                return;
            }
            setNumColumns(newNumColumns - 2);
        };

        Dimensions.addEventListener('change', updateGrid); // Set initial number of columns
        updateGrid(); // Set initial number of columns

    }, []);

    useImperativeHandle(ref, () => ({
        scrollToIndex: (params) => {
            flatListRef.current.scrollToIndex(params);
        },
        scrollToOffset: (params) => {
            flatListRef.current.scrollToOffset(params);
        },
        // Add more functions as needed
    }));


    return (
        <FlatList
            ref={flatListRef}
            numColumns={numColumns}
            key={numColumns}
            {...rest}
        />
    )
});

export default GridList;
