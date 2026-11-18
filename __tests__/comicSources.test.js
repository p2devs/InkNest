import {load} from 'cheerio';
import APICaller from '../src/Redux/Controller/Interceptor';
import {getComicSourceKey} from '../src/Utils/APIs';
import {
  HomePageCardClasses,
  ComicDetailPageClasses,
} from '../src/Screens/Comic/APIs/constance';
import {parseHomePageCards} from '../src/Screens/Comic/APIs/homeParser';
import {getComics, searchComics} from '../src/Screens/Comic/APIs/Home';
import {fetchChaptersWithPagination} from '../src/Redux/Actions/parsers/chapterParser';
import {
  getComicReaderUrl,
  parseComicIssue,
} from '../src/Redux/Actions/parsers/comicBookParser';

jest.mock('../src/Redux/Controller/Interceptor', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));
jest.mock('../src/Redux/Actions/utils/errorHandlers', () => ({
  checkDownTime: jest.fn(),
}));
jest.mock('../src/Utils/sourceStatus', () => ({
  recordSourceSuccess: jest.fn(),
  recordSourceError: jest.fn(),
}));
beforeEach(() => jest.clearAllMocks());

test('XOXO follows relative issue-list pages once and returns reading order', async () => {
  const url = 'https://xoxocomic.com/comic/example';
  const page = issue => `<div id="nt_listchapter"><ul><li class="row">
    <div class="chapter"><a href="${url}/issue-${issue}">Issue ${issue}</a></div>
    </li></ul><ul class="pagination"><li><a rel="next" href="example?page=2">»</a></li></ul></div>`;
  APICaller.get.mockResolvedValueOnce({data: page(1)});
  const chapters = await fetchChaptersWithPagination(
    load(page(2)),
    ComicDetailPageClasses.xoxocomic,
    url,
  );
  expect(APICaller.get).toHaveBeenCalledTimes(1);
  expect(APICaller.get).toHaveBeenCalledWith(url + '?page=2');
  expect(chapters.map(item => item.link)).toEqual([
    url + '/issue-1',
    url + '/issue-2',
  ]);
});

test('the XOXO all-pages view uses the lazy image URLs in order', () => {
  const url = 'https://xoxocomic.com/comic/example';
  const $ =
    load(`<div class="chapter-nav"><a class="backward" href="${url}" title="Example"></a></div>
    <select class="select-chapter"><option selected>Issue 1</option></select>
    <div class="reading-detail"><div class="page-chapter">
    <img src="data:image/gif;base64,AA" data-original="/images/1.jpg">
    <img src="data:image/gif;base64,AA" data-original="//cdn.example.com/2.jpg">
    </div></div><img src="/advert.jpg">`);
  expect(parseComicIssue($, 'xoxocomic', url + '/issue-1/all')).toEqual({
    title: 'Issue 1',
    detailPageTitle: 'Example',
    detailsLink: url,
    images: [
      'https://xoxocomic.com/images/1.jpg',
      'https://cdn.example.com/2.jpg',
    ],
  });
});

test('OceComic keeps the full catalog title and the numeric issue URL without its page fragment', async () => {
  const url = 'https://ocecomic.com/comic/123/example';
  const catalog =
    load(`<main class="Comics"><div class="items"><div class="item">
    <figure><img src="/cover.jpg"></figure><h2><a href="${url}" title="Full title">Full...</a></h2>
    </div></div></main>`);
  expect(
    parseHomePageCards(
      catalog,
      HomePageCardClasses.ocecomic,
      'https://ocecomic.com/comic',
    ),
  ).toEqual([
    expect.objectContaining({
      title: 'Full title',
      link: url,
      image: 'https://ocecomic.com/cover.jpg',
    }),
  ]);
  const $ = load(`<main id="Comic"><div class="issues"><ul><li>
    <a class="issue-link" href="/comic/123/1#1">Issue #1</a>
    <a class="dirlink" href="https://example.org/">click here</a></li></ul></div></main>`);
  await expect(
    fetchChaptersWithPagination($, ComicDetailPageClasses.ocecomic, url),
  ).resolves.toEqual([
    {title: 'Issue #1', link: 'https://ocecomic.com/comic/123/1', date: ''},
  ]);
});

test('only registered comic hosts can enter the native reader', () => {
  expect(getComicSourceKey('https://www.latestcomics.com/en/')).toBe(
    'latestcomics',
  );
  expect(
    getComicSourceKey('https://latestcomics.com/en/comic/example.html'),
  ).toBe('latestcomics');
  expect(
    getComicSourceKey('https://comichubfree.com.evil.test/'),
  ).toBeUndefined();
  expect(getComicSourceKey('https://www.xoxocomic.com/comic/test')).toBe(
    'xoxocomic',
  );
  expect(getComicSourceKey('https://comicbookplus.com/?dlid=1')).toBe(
    'comicbookplus',
  );
  expect(
    getComicSourceKey('https://ocecomic.com.example.org/'),
  ).toBeUndefined();
  expect(
    getComicSourceKey('https://example.org/?next=https://ocecomic.com'),
  ).toBeUndefined();
});

test('ComicHubFree search uses the visible title and the reader opens every page of the selected issue', async () => {
  const series = 'https://comichubfree.com/comic/example';
  APICaller.get.mockResolvedValueOnce({
    data: `<main><h1 class="header-list-index"></h1>
    <div class="cartoon-box"><a class="image"><img src="data:image/gif;base64,AA" data-src="/cover.jpg"></a>
    <div class="mb-right"><h3><a href="${series}" title="Read Example online">Example</a></h3></div></div></main>`,
  });
  const results = await searchComics('comichubfree', 'A & B');
  expect(APICaller.get).toHaveBeenCalledWith(
    'https://comichubfree.com/search-comic?key=A%20%26%20B',
  );
  expect(results).toEqual([
    expect.objectContaining({
      title: 'Example',
      link: series,
      image: 'https://comichubfree.com/cover.jpg',
    }),
  ]);

  const issueUrl = 'https://comichubfree.com/example/issue-1';
  const readerUrl = getComicReaderUrl('comichubfree', issueUrl + '#page2');
  expect(readerUrl).toBe(issueUrl + '/all');
  expect(getComicReaderUrl('comichubfree', readerUrl)).toBe(readerUrl);
  const reader =
    load(`<div class="breadcrumb"><a href="${series}">Example</a></div>
    <select name="chapter_select"><option selected>Issue #1</option></select>
    <div class="chapter-container chapter-all">
    <img class="chapter_img" data-src="/p1.jpg"><img class="chapter_img" data-src="/p2.jpg">
    </div><img src="/ad.jpg">`);
  expect(parseComicIssue(reader, 'comichubfree', readerUrl)).toEqual({
    title: 'Issue #1',
    detailsLink: series,
    detailPageTitle: 'Example',
    images: [
      'https://comichubfree.com/p1.jpg',
      'https://comichubfree.com/p2.jpg',
    ],
  });
});

test('Latest Comics reads the English series grid and stops at the end of the catalog', async () => {
  const card = `<div class="series-card"><a class="series-card-link" href="comic/example.html">
    <div class="series-card-thumb" style="background-image: url('/cover (1).jpg');"></div>
    <h3 class="series-card-title">Example</h3></a></div>`;
  APICaller.get.mockResolvedValueOnce({data: card});
  const result = await getComics('latestcomics');
  expect(APICaller.get).toHaveBeenCalledWith(
    'https://www.latestcomics.com/en/',
  );
  expect(result.lastPage).toBe(1);
  expect(result.comicsData).toEqual([
    expect.objectContaining({
      title: 'Example',
      link: 'https://www.latestcomics.com/en/comic/example.html',
      image: 'https://www.latestcomics.com/cover%20(1).jpg',
    }),
  ]);
  APICaller.get.mockResolvedValueOnce({
    data: `<body class="search"><main>
    <h1 class="page-title"></h1>${card}<article class="chapter-item">Unrelated issue</article></main></body>`,
  });
  await expect(searchComics('latestcomics', 'Example')).resolves.toEqual(
    result.comicsData,
  );
  expect(APICaller.get).toHaveBeenLastCalledWith(
    'https://www.latestcomics.com/en/?s=Example&lang=en',
  );

  const endpoint = 'https://www.latestcomics.com/wp-admin/admin-ajax.php';
  APICaller.get.mockResolvedValueOnce({
    data: `<button id="load-more-series-grid"></button>
    <script id="mangaverse-load-more-js-extra">var mangaverse_ajax = {"ajax_url":"${endpoint}","nonce":"test"};</script>`,
  });
  APICaller.post.mockResolvedValueOnce({
    data: {success: true, data: {html: card, has_more: false}},
  });
  await expect(getComics('latestcomics', 2)).resolves.toEqual({
    comicsData: result.comicsData,
    lastPage: 2,
  });
  expect(APICaller.post).toHaveBeenCalledWith(
    endpoint,
    expect.stringContaining('type=series_grid'),
    expect.anything(),
  );
});

test('Latest Comics follows Load More Chapters, deduplicates and returns oldest first', async () => {
  const host = 'https://www.latestcomics.com';
  const chapter =
    n => `<article class="chapter-item"><a class="chapter-link" href="/en/example/issue-${n}.html">
    <h3 class="chapter-title">Issue #${n}</h3></a></article>`;
  const series = load(`${chapter(
    4,
  )}<button id="load-more-series" data-category="7"></button>
    <script id="mangaverse-load-more-js-extra">var mangaverse_ajax = {
    "ajax_url":"${host}/wp-admin/admin-ajax.php","nonce":"test-value"};</script>`);
  APICaller.post
    .mockResolvedValueOnce({
      data: {success: true, data: {html: chapter(3), has_more: true}},
    })
    .mockResolvedValueOnce({
      data: {
        success: true,
        data: {html: chapter(3) + chapter(2) + chapter(1), has_more: false},
      },
    });
  const chapters = await fetchChaptersWithPagination(
    series,
    ComicDetailPageClasses.latestcomics,
    host + '/en/comic/example.html',
  );
  expect(chapters.map(c => c.title)).toEqual([
    'Issue #1',
    'Issue #2',
    'Issue #3',
    'Issue #4',
  ]);
  expect(
    APICaller.post.mock.calls.map(([, body]) =>
      new URLSearchParams(body).get('page'),
    ),
  ).toEqual(['2', '3']);
  expect(APICaller.post).toHaveBeenCalledWith(
    host + '/wp-admin/admin-ajax.php',
    expect.stringContaining('category_id=7'),
    expect.anything(),
  );
});

test('Latest Comics reads lazy scans in order and links back to the English series', () => {
  const url = 'https://www.latestcomics.com/en/example/issue-1.html';
  const reader = load(`<main><h1 class="entry-title">Example, Issue #1</h1>
    <a class="manga-series" href="/en/comic/example.html">Example</a>
    <div class="entry-content"><figure class="wp-block-image"><img data-src="//cdn.latestcomics.com/1.jpg" src="data:image/gif;base64,AA"></figure>
    <figure class="wp-block-image"><img src="/2.jpg"></figure><img src="/ad.jpg"></div></main>`);
  expect(getComicReaderUrl('latestcomics', url)).toBe(url);
  expect(parseComicIssue(reader, 'latestcomics', url)).toEqual({
    title: 'Example, Issue #1',
    detailPageTitle: 'Example',
    detailsLink: 'https://www.latestcomics.com/en/comic/example.html',
    images: [
      'https://cdn.latestcomics.com/1.jpg',
      'https://www.latestcomics.com/2.jpg',
    ],
  });
});

test('OceComic reads issue pages in order and excludes the series cover', () => {
  const url = 'https://ocecomic.com/comic/123/example';
  const $ = load(`<main id="Comic"><div class="page issue">
    <figure><img src="/scan/1.jpg"></figure><figure><img src="/scan/2.jpg"></figure>
    </div><div class="volume"><div class="nav"><a href="${url}"><i class="fa-home"></i></a></div>
    <div class="pages"><label>Issue #1</label></div></div>
    <div class="share-box"><figure><img src="/cover.jpg"></figure><h4><b>Example</b></h4></div></main>`);
  expect(
    parseComicIssue($, 'ocecomic', 'https://ocecomic.com/comic/123/1'),
  ).toEqual({
    title: 'Issue #1',
    detailPageTitle: 'Example',
    detailsLink: url,
    images: [
      'https://ocecomic.com/scan/1.jpg',
      'https://ocecomic.com/scan/2.jpg',
    ],
  });
});

test('Comic Book Plus keeps the issue keys used by saved reading progress', async () => {
  const $ = load(
    '<table class="catlistings"><tr class="overrow"><td class="n"><a itemprop="url" href="/?dlid=42"><span itemprop="name">Issue 1</span></a></td></tr></table>',
  );
  const chapters = await fetchChaptersWithPagination(
    $,
    ComicDetailPageClasses.comicbookplus,
    'https://comicbookplus.com/?cid=9',
  );
  expect(chapters[0].link).toBe('https://comicbookplus.com?dlid=42');
});
