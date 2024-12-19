import APICaller from "../../../Redux/Controller/Interceptor";
import cheerio from "cheerio";

const getMangaDetailsFromLink = async (link) => {

    try {
        const response = await APICaller.get(link);
        const html = response.data;
        const $ = cheerio.load(html);

        const mangaDetails = {};

        // Extracting the image
        const image = $('.story-info-left .info-image img').attr('src');
        mangaDetails.image = image;

        // Extracting the title
        const title = $('.story-info-right h1').text().trim();
        mangaDetails.title = title;

        // Extracting the alternative title
        const alternativeTitle = $('.variations-tableInfo .table-value h2').first().text().trim();
        mangaDetails.alternativeTitle = alternativeTitle;

        // Extracting authors
        const authors = [];
        $('.variations-tableInfo .table-label:contains("Author")')
            .next('.table-value')
            .find('a')
            .each((i, elem) => {
                authors.push($(elem).text().trim());
            });
        mangaDetails.authors = authors;

        // Extracting the status (Ongoing, Completed, etc.)
        const status = $('.variations-tableInfo .table-label:contains("Status")')
            .next('.table-value')
            .text()
            .trim();
        mangaDetails.status = status;

        // Extracting genres
        const genres = [];
        $('.variations-tableInfo .table-label:contains("Genres")')
            .next('.table-value')
            .find('a')
            .each((i, elem) => {
                genres.push($(elem).text().trim());
            });
        mangaDetails.genres = genres;

        // Extracting the description
        const description = $('.panel-story-info-description')
            .text()
            .replace('Description :', '') // Remove the "Description :" prefix
            .replace(/\n/g, '') // Remove new lines
            .trim();
        mangaDetails.description = description;

        // Extracting the last updated time
        const lastUpdated = $('.story-info-right-extent .stre-label:contains("Updated")')
            .next('.stre-value')
            .text()
            .trim();
        mangaDetails.lastUpdated = lastUpdated;

        // Extracting the views count
        const views = $('.story-info-right-extent .stre-label:contains("View")')
            .next('.stre-value')
            .text()
            .trim();
        mangaDetails.views = views;

        // Extracting the rating
        const rating = parseFloat($('.rate_row_result em[property="v:average"]').text().trim());
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

        return mangaDetails;

    } catch (error) {
        console.error('Error fetching manga details:', error);
        return null;
    }
}


export const getMangaDetails = async (link, setMangaDetails, setLoading) => {
    setLoading(true);
    try {
        const mangaDetails = await getMangaDetailsFromLink(link);
        setLoading(false);
        setMangaDetails(mangaDetails);
    } catch (error) {
        console.error('Error fetching manga details:', error);
        setLoading(false);
    }
}