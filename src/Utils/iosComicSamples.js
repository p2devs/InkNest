import catalog from './iosComicCatalog.json';

// Library cards are also navigation params, so keep issue lists out of them.
export const IOS_SAMPLE_COMICS = catalog.map(({issues, ...series}) => series);

export const getIosSampleSeries = link =>
  catalog.find(series => series.link === link);

const sampleIssueLinks = new Set(
  catalog.flatMap(series => series.issues.map(issue => issue.link)),
);

// Every sample issue opens these bundled pages, so reading never depends on the
// original site being reachable.
const SAMPLE_PAGES = [
  require('../Assets/1.jpg'),
  require('../Assets/2.jpg'),
  require('../Assets/3.jpg'),
  require('../Assets/4.jpg'),
  require('../Assets/5.jpg'),
  require('../Assets/6.jpg'),
  require('../Assets/7.jpg'),
  require('../Assets/8.jpg'),
  require('../Assets/9.jpg'),
  require('../Assets/10.jpg'),
  require('../Assets/11.jpg'),
  require('../Assets/12.jpg'),
  require('../Assets/13.jpg'),
  require('../Assets/14.jpg'),
  require('../Assets/15.jpg'),
  require('../Assets/16.jpg'),
  require('../Assets/17.jpg'),
  require('../Assets/18.jpg'),
  require('../Assets/19.jpg'),
  require('../Assets/20.jpg'),
  require('../Assets/21.jpg'),
  require('../Assets/22.jpg'),
  require('../Assets/23.jpg'),
  require('../Assets/24.jpg'),
  require('../Assets/25.jpg'),
  require('../Assets/26.jpg'),
  require('../Assets/27.jpg'),
  require('../Assets/28.jpg'),
  require('../Assets/29.jpg'),
  require('../Assets/30.jpg'),
  require('../Assets/31.jpg'),
  require('../Assets/32.jpg'),
  require('../Assets/33.jpg'),
];

export const getIosSamplePages = link =>
  sampleIssueLinks.has(link) ? SAMPLE_PAGES : [];
