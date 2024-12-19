import APICaller from "../../../Redux/Controller/Interceptor";
import cheerio from 'cheerio';

export const getSearchManga = async (searchQuery, page = 1) => {
    try {

        const searchText = searchQuery.replaceAll(/[^a-zA-Z0-9]/g, "_")

        const response = await APICaller.get(`https://manganato.com/search/story/${searchText}?page=${`${page}`}`);
        const html = response.data;
        const $ = cheerio.load(html);
        const searchResults = {};

        // Extract search story items (manga details)
        const mangaList = [];
        $('.search-story-item').each((i, elem) => {
            const mangaItem = {};
            const imgElement = $(elem).find('.item-img');
            mangaItem.title = $(elem).find('.item-title').text().trim();
            mangaItem.link = imgElement.attr('href');
            mangaItem.image = imgElement.find('img').attr('src');
            mangaItem.rating = parseFloat($(elem).find('.item-rate').text().trim());
            mangaItem.author = $(elem).find('.item-author').text().trim();
            mangaItem.updated = $(elem).find('.item-time').first().text().replace('Updated : ', '').trim();
            mangaItem.views = $(elem).find('.item-time').last().text().replace('View : ', '').trim();
            mangaItem.chapterLinks = [];

            $(elem).find('.item-chapter').each((j, chapterElem) => {
                mangaItem.chapterLinks.push({
                    chapterName: $(chapterElem).text().trim(),
                    chapterLink: $(chapterElem).attr('href')
                });
            });

            mangaList.push(mangaItem);
        });

        searchResults.searchlist = mangaList;

        //  Extract pagination information
        const pagination = {};

        // Current page
        const currentPageElement = $('.group-page a.page-blue').filter((i, el) => {
            const pageText = $(el).text().trim();
            return !isNaN(parseInt(pageText, 10));
        }).last();

        pagination.currentPage = currentPageElement.length ? parseInt(currentPageElement.text().trim(), 10) : null;

        // Last page URL and total pages
        const lastPageElement = $('.page-blue.page-last');
        const lastPageText = lastPageElement.text();
        pagination.totalPages = lastPageText ? parseInt(lastPageText.match(/LAST\((\d+)\)/)?.[1], 10) : null;

        // Total results
        const totalResultsText = $('.group-qty .page-blue').text();
        pagination.totalResults = totalResultsText
            ? parseInt(totalResultsText.replace('TOTAL : ', '').replace(',', ''), 10)
            : null;


        searchResults.pagination = pagination;
        console.log(pagination, 'searchResults');


        return searchResults;

    } catch (error) {
        console.error('Error fetching search results:', error);
    }
}


export const searchManga = async (searchQuery, page, setData, setLoading) => {
    setLoading(true);
    try {
        const searchResults = await getSearchManga(searchQuery, page);
        setData(searchResults);
        setLoading(false);
    } catch (error) {
        console.error('Error fetching search results:', error);
        setLoading(false);
    }
}