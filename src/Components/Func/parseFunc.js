export const parseReadAllComicsDetails = ($, config, link) => {
  const container = $(config.container);

  const title = container.find(config.title).text().trim();
  const imgSrc = container.find(config.image).attr(config.imageAttr);
  const genres = container.find(config.genre).text().trim();
  const publisher = container.find(config.author).text().trim();

  const volumes = [];
  container.find(config.volumeDescription).each((_, el) => {
    const description = $(el).nextAll(config.summarySelector).text().trim();
    if (description) volumes.push(description);
  });

  const chapters = [];
  $(config.chapters).each((_, el) => {
    const title = $(el).attr(config.chapterTitleAttr);
    const link = $(el).attr(config.chapterLinkAttr);
    if (title && link) {
      chapters.push({title, link});
    }
  });

  return {
    title,
    imgSrc,
    type: null,
    status: null,
    releaseDate: null,
    categories: null,
    tags: [],
    genres,
    author: publisher,
    alternativeName: null,
    views: null,
    rating: null,
    summary: volumes.join('\n'),
    chapters,
    pagination: [],
    link,
  };
};
