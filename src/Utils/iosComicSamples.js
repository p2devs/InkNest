// Fixed content for the version-specific iOS Library, independent of the live catalogs.
const site = 'https://comicbookplus.com/';
const images = 'https://box01.comicbookplus.com';

export const IOS_SAMPLE_COMICS = [
  {
    title: 'All Love',
    link: site + '?cid=3245',
    image: images + '/thumbs/ace/AllLove.png',
    publishDate: 'May 1949 - May 1950',
  },
  {
    title: 'All Romances',
    link: site + '?cid=858',
    image: images + '/thumbs/ace/AllRomances.png',
    publishDate: 'Aug 1949 - Aug 1950',
  },
  {
    title: 'Andy Comics',
    link: site + '?cid=859',
    image: images + '/thumbs/ace/Andy.png',
    publishDate: 'Jun 1948 - Aug 1948',
  },
  {
    title: 'Atomic War!',
    link: site + '?cid=860',
    image: images + '/thumbs/ace/AtomicWar.png',
    publishDate: 'Nov 1952 - Apr 1953',
  },
];

const firstVolume = images + '/viewer/4a/4af4d2facd653c6fee0013367c681f6a';
const secondVolume = images + '/viewer/7c/7ce6723c8f20d1ce3b78c2cda1debc50';

export const IOS_SAMPLE_CHAPTERS = [
  {
    title: 'Issues 1',
    link: site + '?dlid=16848',
    date: 'December 4, 2010',
    pages: firstVolume,
  },
  {
    title: 'Issues 2',
    link: site + '?dlid=15946',
    date: 'November 27, 2010',
    pages: firstVolume,
  },
  {
    title: 'Issues 3',
    link: site + '?dlid=16857',
    date: 'December 4, 2010',
    pages: secondVolume,
  },
  {
    title: 'Issues 4',
    link: site + '?cid=860',
    date: 'August 7, 2015',
    pages: secondVolume,
  },
];

export const getIosSamplePages = link => {
  const chapter = IOS_SAMPLE_CHAPTERS.find(item => item.link === link);
  return chapter
    ? Array.from({length: 35}, (_, index) => `${chapter.pages}/${index}.jpg`)
    : [];
};
