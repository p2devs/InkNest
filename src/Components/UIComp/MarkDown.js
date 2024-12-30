// MarkdownParser.js
import React from 'react';
import { Text, View, StyleSheet, Linking } from 'react-native';

// Helper function to parse markdown text
const parseMarkdown = (text) => {
    const lines = text.split('\n');
    const parsedLines = lines.map((line, index) => {
        if (line.startsWith('# ')) {
            return <Text key={index} style={styles.h1}>{line.substring(2)}</Text>;
        } else if (line.startsWith('## ')) {
            return <Text key={index} style={styles.h2}>{line.substring(3)}</Text>;
        } else if (line.startsWith('### ')) {
            return <Text key={index} style={styles.h3}>{line.substring(4)}</Text>;
        } else if (line.startsWith('**') && line.includes('**')) {
            return <Text key={index} style={styles.bold}>{line.replaceAll('**', '')}</Text>;
        } else if (line.startsWith('* ')) {
            return <Text key={index} style={styles.listItem}>{'\u2022'} {line.substring(2)}</Text>;
        } else if (line.startsWith('- ')) {
            return <Text key={index} style={styles.listItem}>{'\u2022'} {line.substring(2)}</Text>;
        } else if (line.startsWith('   - ')) {
            return <Text key={index} style={styles.subListItem}>{'\u2219'} {line.substring(4)}</Text>;
        } else if (line.startsWith('      - ')) {
            return <Text key={index} style={styles.subSubListItem}>{'\u2023'} {line.substring(7)}</Text>;
        } else if (line.startsWith('> ')) {
            return <Text key={index} style={styles.blockquote}>{line.substring(2)}</Text>;
        } else if (line.startsWith('```')) {
            return <Text key={index} style={styles.codeBlock}>{line.substring(3)}</Text>;
        } else if (line.startsWith('[') && line.includes('](')) {
            const endIndex = line.indexOf('](');
            const text = line.substring(1, endIndex);
            const url = line.substring(endIndex + 2, line.length - 1).replace(/[()]/g, '')
            
            return <Text key={index} style={styles.link} onPress={() => Linking.openURL(url)}> {text}</Text >;
        } else {
            return <Text key={index} style={styles.paragraph} > {line}</Text >;
        }
    });

    return parsedLines;
};

const Markdown = ({ content }) => {
    return (
        <View style={styles.container}>
            {parseMarkdown(content)}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
    },
    h1: {
        color: "white",
        fontSize: 28,
        fontWeight: 'bold',
    },
    h2: {
        color: "white",
        fontSize: 24,
        fontWeight: 'bold',
    },
    h3: {
        color: "white",
        fontSize: 18,
        fontWeight: 'bold',
    },
    paragraph: {
        color: "white",
        fontSize: 16,
    },
    bold: {
        fontWeight: 'bold',
        color: "white",
        fontSize: 16,
    },
    listItem: {
        color: "white",
        fontSize: 16,
        marginBottom: 5,
        paddingLeft: 15,
    },
    subListItem: {
        color: "white",
        fontSize: 16,
        marginBottom: 5,
        paddingLeft: 30,
    },
    subSubListItem: {
        color: "white",
        fontSize: 16,
        marginBottom: 5,
        paddingLeft: 50,
    },
    blockquote: {
        color: "white",
        fontSize: 16,
        fontStyle: 'italic',
        borderLeftWidth: 4,
        borderLeftColor: '#ddd',
        paddingLeft: 10,
    },
    codeBlock: {
        color: "white",
        fontFamily: 'monospace',
        backgroundColor: '#f4f4f4',
        padding: 10,
        borderRadius: 5,
    },
    link: {
        color: 'steelblue',
        textDecorationLine: 'underline',
    },
});

export default Markdown;
