import APICaller from "../../../Redux/Controller/Interceptor";
import cheerio from "cheerio";

export const getManga = async (page = 1, type = null) => {
    try {
        console.log('page:', page, 'type:', type);

        let url = `https://manganato.com/genre-all`;
        const response = await APICaller.get(`${url}/${page}${type ? `?type=${type}` : ""}`);
        const html = response.data;
        const $ = cheerio.load(html);

        let mangaData = {}

        const mangaList = [];
        $('.panel-content-genres .content-genres-item').each((index, element) => {

            const item = $(element);
            const title = item.find('.genres-item-name').attr('title');
            const image = item.find('.genres-item-img img').attr('src');
            const link = item.find('.genres-item-img').attr('href');
            const description = item.find('.genres-item-description').text().trim();
            const releaseDate = item.find('.genres-item-time').text().trim();
            const chapterTitle = item.find('.genres-item-chap').attr('title');
            const chapterLink = item.find('.genres-item-chap').attr('href');
            const rating = item.find('.genres-item-rate').text().trim();
            const views = item.find('.genres-item-view').text().trim();
            const author = item.find('.genres-item-author').text().trim();

            mangaList.push({
                title,
                image,
                link,
                description,
                releaseDate,
                Chapter: {
                    title: chapterTitle,
                    link: chapterLink
                },
                rating,
                views,
                author
            });
        });

        const pagination = {};

        // Current page
        pagination.currentPage = parseInt($('.page-select').text().trim(), 10);

        // Total pages
        const lastPageText = $('.page-blue.page-last').text();
        pagination.totalPages = parseInt(lastPageText.replace(/LAST\((\d+)\)/, '$1'), 10);

        // Total results
        // const totalResultsText = $('.group-qty .page-blue').text();
        // pagination.totalResults = parseInt(totalResultsText.replace(/TOTAL : /, '').replace(',', ''), 10);

        mangaData = {
            mangaList,
            pagination
        };

        console.log(pagination, 'mangaData');

        return mangaData;
    } catch (error) {
        console.error(error, 'Error fetching manga data');
        return [];
    }
}


export const getMangaHome = async (setManga, setLoading) => {
    setLoading(true);
    try {
        const [
            latest_data,
            topview_data,
            newest_data
        ] = await Promise.all([getManga(), getManga(1, 'topview'), getManga(1, 'newest')]);
        setManga({
            latest: latest_data,
            topview: topview_data,
            newest: newest_data
        });
        setLoading(false);
    } catch (error) {
        console.error('Error fetching manga Home data:', error);
        setLoading(false);
    }

}