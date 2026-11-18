import {load} from 'cheerio';
import APICaller from '../src/Redux/Controller/Interceptor';
import {getComicSourceKey} from '../src/Utils/APIs';
import {
  HomePageCardClasses,
  ComicDetailPageClasses,
} from '../src/Screens/Comic/APIs/constance';
import {parseHomePageCards} from '../src/Screens/Comic/APIs/homeParser';
import {fetchChaptersWithPagination} from '../src/Redux/Actions/parsers/chapterParser';
import {parseComicIssue} from '../src/Redux/Actions/parsers/comicBookParser';

jest.mock('../src/Redux/Controller/Interceptor', () => ({get: jest.fn()}));

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
