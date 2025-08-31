export interface ComicItem {
  image: string;
  title: string;
  genres?: string | null;
  publishDate?: string;
  link?: string;
  status?: string | null;
}

export interface ComicSection {
  data: ComicItem[];
  hostName: string;
  lastPage: number | null;
  title: string;
}

export interface ComicsData {
  [key: string]: ComicSection;
}
