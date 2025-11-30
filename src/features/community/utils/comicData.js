export const hasRenderableChapters = detail => {
  if (!detail || typeof detail !== 'object') {
    return false;
  }
  const chapterList = Array.isArray(detail.chapters) ? detail.chapters : [];
  const issueList = Array.isArray(detail.issues) ? detail.issues : [];
  return chapterList.length > 0 || issueList.length > 0;
};
