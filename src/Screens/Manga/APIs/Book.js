import APICaller from "../../../Redux/Controller/Interceptor";
import cheerio from "cheerio";

const getMangaBookFromLink = async (link) => {
    try {
        const response = await APICaller.get(link);
        const html = response.data;
        const $ = cheerio.load(html);

        const mangaData = {};

        // Extract the next and previous chapter links
        const prevChapterLink = $('.navi-change-chapter-btn-prev').attr('href');
        const nextChapterLink = $('.navi-change-chapter-btn-next').attr('href');

        mangaData.navigation = {
            prevChapter: prevChapterLink,
            nextChapter: nextChapterLink
        };

        // Extract the current chapter title
        const chapterTitle = $('.panel-chapter-info-top h1').text().trim();
        mangaData.chapterTitle = chapterTitle;

        // // Extract the chapter selection dropdown options (list of chapters)
        // const chapterList = [];
        // $('.navi-change-chapter option').each((i, elem) => {
        //     const chapterNum = $(elem).text();
        //     const chapterUrl = `chapter-${$(elem).data('c')}`;
        //     chapterList.push({ chapterNum, chapterUrl });
        // });

        // mangaData.chapterList = chapterList;

        // Extract all the image URLs from the content
        const images = [];
        $('.container-chapter-reader img').each((i, elem) => {
            images.push({
                src: $(elem).attr('src'),
                alt: $(elem).attr('alt'),
                title: $(elem).attr('title')
            });
        });

        mangaData.images = images;

        return mangaData;

    } catch (error) {
        console.error('Error fetching manga Book data:', error);
        return null;
    }
}


export const getMangaBook = async (link, setMangaData, setLoading) => {
    setLoading(true);
    try {
        const mangaData = await getMangaBookFromLink(link);
        setMangaData(mangaData);
        setLoading(false);
    } catch (error) {
        setLoading(false);
        console.error('Error fetching manga Book data:', error);
    }
}
