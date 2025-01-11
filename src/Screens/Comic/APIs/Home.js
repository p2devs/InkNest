import APICaller from "../../../Redux/Controller/Interceptor";
import cheerio from "cheerio";
import { ComicHostName } from "../../../Utils/APIs";
import { HomePageCardClasses } from "./constance";


const getComics = async (hostName, page = 1, type = null) => {
    try {
        const hostKey = Object.keys(ComicHostName).find(key => ComicHostName[key] === hostName);

        // Construct the URL and parameters based on the host and type
        const parms = hostName === ComicHostName.readallcomics ? `page/${page}/` : `${type}?page=${page}`;

        const response = await APICaller.get(`${hostName}${parms}`);
        const html = response.data;
        const $ = cheerio.load(html);

        let comicsData = [];

        // Get the tag configuration for the specified host and type
        const tagConfig = HomePageCardClasses[hostKey]?.[type ?? "all-comic"]; // Default to 'all-comic' for readallcomics

        if (tagConfig) {
            // Extract comics data based on the selected configuration
            $(tagConfig.cardClass).each((index, element) => {
                const title = $(element).find(tagConfig.cardTitleClass).text().trim();
                const link = $(element).find(tagConfig.cardTitleClass).attr('href');
                const image = $(element).find(tagConfig.imageClass).attr('src');

                // Handle genres only if the genres class is defined
                const genres = [];
                if (tagConfig.genresClass) {
                    $(element).find(tagConfig.genresClass).each((i, genreElem) => {
                        genres.push($(genreElem).text().trim());
                    });
                }

                const status = tagConfig.statusClass ? $(element).find(tagConfig.statusClass).text().trim() : null;

                // Handle date if available for certain hosts/types
                const publishDate = tagConfig.dateClass ? $(element).find(tagConfig.dateClass).text().trim() : null;

                comicsData.push({
                    title,
                    link,
                    image,
                    genres: genres.length > 0 ? genres[0] : null,
                    status,
                    publishDate
                });
            });
        }

        return comicsData;
    } catch (error) {
        console.error('Error fetching comics data:', error);
        return null;
    }
};


export const getComicsHome = async (setComics, setLoading) => {
    setLoading(true);
    try {
        const [
            readallcomics,
            az_on_going,
            az_porpular,
            az_upcoming,
        ] = await Promise.all([getComics(ComicHostName.readallcomics), getComics(ComicHostName.azcomic, 1, 'ongoing-comics'), getComics(ComicHostName.azcomic, 1, 'popular-comics'), getComics(ComicHostName.azcomic, 1, 'new-comics')]);

        const ComicHomeList = {}

        if (readallcomics) {
            ComicHomeList.readallcomics = {
                title: 'Read All Comics',
                data: readallcomics
            }
        }

        if (az_on_going) {
            ComicHomeList['ongoing-comics'] = {
                title: 'Latest',
                data: az_on_going
            }
        }

        if (az_porpular) {
            ComicHomeList['popular-comics'] = {
                title: 'Popular',
                data: az_porpular
            }
        }

        if (az_upcoming) {
            ComicHomeList['new-comics'] = {
                title: 'New Arrivals',
                data: az_upcoming
            }
        }

        setComics(ComicHomeList);

        setLoading(false);
    } catch (error) {
        console.error('Error fetching manga Home data:', error);
        setLoading(false);
    }

}