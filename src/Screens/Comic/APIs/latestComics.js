import APICaller from '../../../Redux/Controller/Interceptor';
import {getComicSourceKey} from '../../../Utils/APIs';

// The English catalog and chapter lists share the site's Load More form.
export const loadMoreLatestComics = async ($, page, type) => {
  const button = $(
    type === 'series' ? '#load-more-series' : '#load-more-series-grid',
  );
  const script = $('#mangaverse-load-more-js-extra').text();
  const json = script.match(/\bmangaverse_ajax\s*=\s*(\{[\s\S]*?\})\s*;/)?.[1];
  const settings = json && JSON.parse(json);
  if (
    !button.length ||
    !settings?.nonce ||
    getComicSourceKey(settings.ajax_url) !== 'latestcomics'
  ) {
    throw new Error('Could not load more results from Latest Comics.');
  }

  const form = new URLSearchParams({
    action: 'mangaverse_load_more',
    type,
    page: String(page),
    lang: 'en',
    nonce: settings.nonce,
  });
  if (type === 'series') {
    form.append('category_id', button.attr('data-category'));
    form.append('order', 'desc');
  }
  const {data} = await APICaller.post(settings.ajax_url, form.toString(), {
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  });
  if (
    !data?.success ||
    typeof data.data?.html !== 'string' ||
    typeof data.data.has_more !== 'boolean'
  ) {
    throw new Error('Latest Comics returned an incomplete page.');
  }
  return {html: data.data.html, hasMore: data.data.has_more};
};
