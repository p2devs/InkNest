import * as cheerio from 'cheerio';

import {parseReadAllComicsBook} from '../src/Redux/Actions/parsers/comicBookParser';

describe('parseReadAllComicsBook', () => {
  it('extracts page images from the current lazy-loaded ReadAllComics markup', () => {
    const $ = cheerio.load(`
      <body>
        <div class="index-wrapper">
          <center>
            <p>
              <img src="https://cdn.example.com/001.jpg" />
            </p>
            <p>
              <img
                src="https://readallcomics.com/wp-content/plugins/lazy-load-images-and-background-images/assets/images/preloader.gif"
                data-jh-lazy-img="https://cdn.example.com/002.jpg"
              />
            </p>
            <p>
              <img
                src="https://readallcomics.com/wp-content/plugins/lazy-load-images-and-background-images/assets/images/preloader.gif"
                data-jh-lazy-img="https://cdn.example.com/003.jpg"
              />
            </p>
          </center>
        </div>
        <h3 style="color: #0363df"><strong>Batman v4 007 (2026)</strong></h3>
        <a rel="category tag" href="https://readallcomics.com/category/batman/">Batman</a>
      </body>
    `);

    const parsed = parseReadAllComicsBook($, {
      titleSelector: 'h3[style*="color: #0363df"] strong',
      detailsLinkSelector: 'a[rel="category tag"]',
    });

    expect(parsed).toEqual({
      images: [
        'https://cdn.example.com/001.jpg',
        'https://cdn.example.com/002.jpg',
        'https://cdn.example.com/003.jpg',
      ],
      title: 'Batman v4 007 (2026)',
      detailsLink: 'https://readallcomics.com/category/batman/',
      detailPageTitle: 'Batman',
    });
  });
});
