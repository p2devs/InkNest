// import axios from "axios";
import cheerio from "cheerio";
import { fetchDataStart } from "../../Redux/Reducers";
import { checkDownTime } from "../../Redux/Actions/GlobalActions";
import { AnimeHostName, AnimeHostName as HostName } from "../../Utils/APIs";
import APICaller from "../../Redux/Controller/Interceptor";

export const GetVideoLink = async (link, dispatch) => {
    dispatch(fetchDataStart());
    try {
        const response = await APICaller.get(link);
        const $ = cheerio.load(response.data);
        let result = {};
        // console.log(response.data);
        if (link.includes("gogoanimes")) {
            const isError404 = $('h1.entry-title').text().trim()
            if (isError404.includes("Error 404")) {
                if (dispatch) dispatch(checkDownTime({ response: { status: 404, AnimeVideo: true } }));
                return;
            }

            // const category = $('.anime_video_body_cate a').text();
            //target  span which have text Category: and get next a tag text and href
            const categoryTitle = $('.anime_video_body_cate span:contains("Category:")').next().text();
            const categoryLink = $('.anime_video_body_cate span:contains("Category:")').next().attr('href');
            const animeInfoTitle = $('.anime-info a').attr('title');
            const animeInfoLink = $('.anime-info a').attr('href');
            const downloadLink = $('.favorites_book .dowloads a').attr('href');

            // Extract episode page ranges
            const episodePages = [];
            $('#episode_page li a').each((index, element) => {
                const epStart = $(element).attr('ep_start');
                const epEnd = $(element).attr('ep_end');
                const active = $(element).hasClass('active');
                // console.log(element);
                episodePages.push({ epStart, epEnd, active });
            });

            // Extract episodes
            const movie_id = $('#movie_id').val();
            const default_ep = $('#default_ep').val();
            const alias_anime = $('#alias_anime').val();
            const activeEp = episodePages.find((ep) => ep.active);
            const episodes = await getEpisodes({ ep_start: activeEp?.epStart ?? 1, ep_end: activeEp?.epEnd ?? 100, id: movie_id, default_ep, alias: alias_anime, dispatch });

            // Extract Server Links
            const dowloads = $('.dowloads a').attr('href');
            const id = dowloads.split('id=')[1].split('&')[0];
            const title = dowloads.split('title=')[1];
            const servers = await getVideoLink({ id, title, dispatch });

            result = {
                category: { title: categoryTitle, link: `${HostName["gogoanimes"]}${categoryLink.replace("/", "")}`, },
                animeInfo: {
                    title: animeInfoTitle,
                    link: `${HostName["gogoanimes"]}${animeInfoLink.replace("/", "")}`,
                },
                downloadLink,
                servers,
                episodes,
                episodePages,
                id,
                title,
                movie_id,
                alias_anime,
                default_ep
            };
        }
        if (link.includes("s3taku")) {
            // Extract title and episode number
            const titleText = $('.video-info-left h1').text().trim();
            const titleMatch = titleText.match(/^(.*?)\sEpisode\s(\d+)/);
            const title = titleMatch[1].trim();
            const episode = parseInt(titleMatch[2]);

            // Extract video ID from iframe URL
            const iframeSrc = $('.play-video iframe').attr('src');
            const idMatch = iframeSrc.match(/id=([\w-]+)/);
            const id = idMatch[1];

            // Extract description
            const description = $('.video-details .post-entry .content-more-js').text().trim();

            // Extract episode list
            const episodes = [];
            $('.listing.items.lists .video-block').each((i, el) => {
                const episodeTitle = $(el).find('.name').text().trim();
                const episodeLink = $(el).find('a').attr('href');
                //get episode number from title
                const episodeMatch = episodeTitle.match(/Episode (\d+)/);
                let EP = episodeMatch ? parseInt(episodeMatch[1], 10) : null;
                //get the category of the episode like dub or sub from title
                const episodeCategory = episodeTitle.includes("Dub") ? "Dub" : episodeTitle.includes("Sub") ? "Sub" : "Other";
                //check for active episode by comparing the episode number
                episodes.push({ title: episodeTitle, episodeLink: `${HostName["s3taku"]}${episodeLink}`, episodeNumber: "Ep " + EP, episodeCategory, active: EP == episode });
            });

            // Format the data
            result = {
                title,
                episode,
                id,
                description,
                episodes,
            };

        }
        dispatch(checkDownTime(response));
        return result;
    } catch (error) {
        console.log('Error fetching or parsing data AnimeVideo:', error);
        if (dispatch) dispatch(checkDownTime(error));
        return null;
    }
}

export const getEpisodes = async ({ ep_start = 1, ep_end = 1000, id = 1, default_ep = 0, alias = "", dispatch }) => {
    try {
        let response = await APICaller.get(`https://ajax.gogocdn.net/ajax/load-list-episode?ep_start=${ep_start}&ep_end=${ep_end}&id=${id}&default_ep=${default_ep}&alias=${alias}`);
        const $ = cheerio.load(response.data);
        const episodes = [];
        $('#episode_related li').each((index, element) => {
            const episodeNumber = $(element).find('.name').text().trim();
            const episodeLink = $(element).find('a').attr('href').trim();
            const episodeCategory = $(element).find('.cate').text().trim();
            //set active to default episode
            episodes.push({ episodeNumber, episodeLink: `${HostName["gogoanimes"]}${episodeLink.replace("/", "")}`, episodeCategory, active: episodeNumber == `EP ${default_ep}` });
        });
        return episodes;
    } catch (error) {
        console.log('Error fetching or parsing data eps:', error);
        // if (dispatch) dispatch(checkDownTime(error));
        return null;

    }
}
export const getVideoLink = async ({ id, title, dispatch }) => {
    try {
        let link = `https://s3taku.com/streaming.php?id=${id}&title=${title}`
        const response = await APICaller.get(link);
        const $ = cheerio.load(response.data);
        let videoserver = []
        $('#list-server-more .list-server-items li').each((index, element) => {
            const serverName = $(element).text().trim();
            let serverLink = $(element).attr('data-video');
            if (serverName == "Vidstreaming") serverLink = link
            videoserver.push({ serverName, serverLink });
        });
        return videoserver;

    } catch (error) {
        console.log('Error fetching or parsing data videoserver:', error);
        // if (dispatch) dispatch(checkDownTime(error));
        return null;
    }

}

export const getAnimeInfo = async (link, dispatch) => {
    dispatch(fetchDataStart());

    try {
        let response = await APICaller.get(link);
        const $ = cheerio.load(response.data);

        const isError404 = $('h1.entry-title').text().trim()
        if (isError404.includes("Error 404")) {
            if (dispatch) dispatch(checkDownTime({ response: { status: 404, AnimeVideo: true } }));
            return;
        }
        // Extract title
        const title = $('.anime_info_body_bg h1').text().trim();

        // Extract image URL
        const imageUrl = $('.anime_info_body_bg img').attr('src');

        // Extract type
        const type = $('.anime_info_body_bg .type').filter((i, el) => $(el).text().includes('Type:')).find('a').text().trim();

        // Extract plot summary
        const plotSummary = $('.anime_info_body_bg .description').text().trim();

        // Extract genres
        const genres = [];
        $('.anime_info_body_bg .type').filter((i, el) => $(el).text().includes('Genre:')).find('a').each((i, el) => {
            genres.push($(el).text().trim());
        });

        // Extract release year
        const releaseYear = $('.anime_info_body_bg .type').filter((i, el) => $(el).text().includes('Released:')).text().replace('Released:', '').trim();

        // Extract status
        const status = $('.anime_info_body_bg .type').filter((i, el) => $(el).text().includes('Status:')).find('a').text().trim();

        // Extract other names
        const otherNames = [];
        $('.anime_info_body_bg .other-name').find('a').each((i, el) => {
            otherNames.push($(el).text().trim());
        });

        // Extract episode page ranges
        const episodePages = [];
        $('#episode_page li a').each((index, element) => {
            const epStart = $(element).attr('ep_start');
            const epEnd = $(element).attr('ep_end');
            const active = $(element).hasClass('active');
            // console.log(element);
            episodePages.push({ epStart, epEnd, active });
        });
        if (episodePages.length == 1) episodePages[0].active = true;
        // Extract episodes
        const movie_id = $('#movie_id').val();
        const default_ep = $('#default_ep').val();
        const alias_anime = $('#alias_anime').val();
        const activeEp = episodePages.find((ep) => ep.active);
        const episodes = await getEpisodes({ ep_start: activeEp?.epStart ?? 1, ep_end: activeEp?.epEnd ?? 100, id: movie_id, default_ep, alias: alias_anime, dispatch });

        const result = {
            title,
            imageUrl: `${HostName["gogoanimes"]}${imageUrl.replace("/", "")}`,
            type,
            plotSummary,
            genres,
            releaseYear,
            status,
            otherNames,
            episodes,
            episodePages,
            id: movie_id,
            alias: alias_anime
        };

        dispatch(checkDownTime(response));
        return result;
    } catch (error) {
        console.log('Error fetching or parsing data AnimeVideo:', error);
        if (dispatch) dispatch(checkDownTime(error));
        return null;
    }
}

export const SearchAnime = async (search, dispatch, baseUrl) => {
    dispatch(fetchDataStart());
    try {
        let host = AnimeHostName["gogoanimes"];
        let url = `${host}search.html?keyword=${search}`
        const response = await APICaller.get(url);
        const $ = cheerio.load(response.data);

        const result = [];
        // if (baseUrl == "gogoanimes") {
        // Extract information from the list items
        $('ul.items li').each((i, el) => {
            const title = $(el).find('.name a').attr('title').trim();
            const link = $(el).find('.name a').attr('href');
            let imageUrl = $(el).find('.img img').attr('src');
            const date = $(el).find('.released').text().replace('Released:', '').trim();
            //check if image missing host name then add https://gogocdn.net/r
            if (!imageUrl.includes("https://")) imageUrl = `${host}${imageUrl.replace("/", "")}`;
            result.push({ title, link: `${host}${link}`, imageUrl, date });
        });
        // }
        // if (baseUrl == "s3taku") {
        //     $('ul.listing.items li.video-block').each((index, element) => {
        //         const link = $(element).find('a').attr('href');
        //         const image = $(element).find('img').attr('src');
        //         const title = $(element).find('div.name').text().trim();
        //         const date = $(element).find('span.date').text().trim();

        //         result.push({
        //             link,
        //             image,
        //             title,
        //             date
        //         });
        //     });

        // }

        // Log the extracted information
        console.log(result);

        dispatch(checkDownTime(response));
        return result;
    } catch (error) {
        console.log('Error fetching or parsing data AnimeVideo:', error);
        if (dispatch) dispatch(checkDownTime(error));
        return null;
    }
}