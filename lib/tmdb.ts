import type { Genre, Movie, SearchCategory, SearchResponse } from '../typings';

const BASE_URL = 'https://api.themoviedb.org/3';
const REQUEST_TIMEOUT_MS = 8000;
const REVALIDATE_SECONDS = 3600;
const SEARCH_REVALIDATE_SECONDS = 120;
export const MAX_SEARCH_PAGE = 20;

type MediaType = 'movie' | 'tv';

const SEARCH_PATHS: Record<SearchCategory, string> = {
  all: '/search/multi',
  movie: '/search/movie',
  tv: '/search/tv',
};

const CATALOGUE_PATHS = {
  netflixOriginals: '/discover/movie?with_networks=213',
  trending: '/trending/all/week?language=en-US',
  topRated: '/movie/top_rated?language=en-US',
  action: '/discover/movie?language=en-US&with_genres=28',
  comedy: '/discover/movie?language=en-US&with_genres=35',
  horror: '/discover/movie?language=en-US&with_genres=27',
  romance: '/discover/movie?language=en-US&with_genres=10749',
  documentaries: '/discover/movie?language=en-US&with_genres=99',
} as const;

export type CatalogueKey = keyof typeof CATALOGUE_PATHS;

export type TmdbDetails = {
  genres: Genre[];
  trailerKey: string;
};

export class TmdbUpstreamError extends Error {
  constructor(public readonly status: number) {
    super('TMDB upstream request failed');
  }
}

const buildUrl = (path: string) => {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new TmdbUpstreamError(503);
  }

  const separator = path.includes('?') ? '&' : '?';
  return `${BASE_URL}${path}${separator}api_key=${encodeURIComponent(apiKey)}`;
};

const fetchJson = async (
  path: string,
  revalidateSeconds = REVALIDATE_SECONDS
): Promise<unknown> => {
  const url = buildUrl(path);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: revalidateSeconds },
    } as RequestInit);
  } catch {
    throw new TmdbUpstreamError(504);
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) {
    throw new TmdbUpstreamError(429);
  }

  if (!response.ok) {
    throw new TmdbUpstreamError(response.status >= 500 ? 503 : 502);
  }

  try {
    return await response.json();
  } catch {
    throw new TmdbUpstreamError(502);
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const asString = (value: unknown): string =>
  typeof value === 'string' ? value : '';

const asNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const asNumberArray = (value: unknown): number[] =>
  Array.isArray(value)
    ? value.filter(
        (item): item is number => typeof item === 'number' && Number.isFinite(item)
      )
    : [];

const dedupeMovies = (movies: Movie[]): Movie[] => {
  const seen = new Set<string>();

  return movies.filter((movie) => {
    const key = `${movie.media_type || 'movie'}:${movie.id}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const normalizeSearchResult = (
  value: unknown,
  forcedMediaType?: MediaType
): Movie | null => {
  if (!isObject(value) || value.adult === true) {
    return null;
  }

  const rawMediaType = asString(value.media_type);
  const mediaType =
    forcedMediaType ||
    (rawMediaType === 'movie' || rawMediaType === 'tv' ? rawMediaType : '');

  if (!mediaType) {
    return null;
  }

  const id = asNumber(value.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  const title =
    asString(value.title) ||
    asString(value.name) ||
    asString(value.original_title) ||
    asString(value.original_name) ||
    'Untitled';
  return {
    title,
    name: title,
    backdrop_path: asString(value.backdrop_path),
    media_type: mediaType,
    release_date: mediaType === 'movie' ? asString(value.release_date) : '',
    first_air_date: mediaType === 'tv' ? asString(value.first_air_date) : '',
    genre_ids: asNumberArray(value.genre_ids),
    id,
    origin_country: asStringArray(value.origin_country),
    original_language: asString(value.original_language),
    original_name:
      asString(value.original_name) || asString(value.original_title) || title,
    overview: asString(value.overview),
    popularity: asNumber(value.popularity),
    poster_path: asString(value.poster_path),
    vote_average: asNumber(value.vote_average),
    vote_count: asNumber(value.vote_count),
    adult: false,
  };
};

export const fetchCatalogue = async (key: CatalogueKey): Promise<Movie[]> => {
  try {
    const data = await fetchJson(CATALOGUE_PATHS[key]);

    if (!isObject(data) || !Array.isArray(data.results)) {
      return [];
    }

    return data.results as Movie[];
  } catch {
    return [];
  }
};

export const fetchDetails = async (
  mediaType: MediaType,
  id: number
): Promise<TmdbDetails> => {
  const data = await fetchJson(
    `/${mediaType}/${id}?language=en-US&append_to_response=videos`
  );

  if (!isObject(data)) {
    throw new TmdbUpstreamError(502);
  }

  const genres = Array.isArray(data.genres) ? (data.genres as Genre[]) : [];

  const videos = isObject(data.videos) ? data.videos.results : undefined;
  const videoResults = Array.isArray(videos)
    ? (videos as Array<{ type?: unknown; key?: unknown }>)
    : [];

  const findTrailerKey = (type: 'Trailer' | 'Teaser') =>
    videoResults.find(
      (video) => video.type === type && typeof video.key === 'string'
    )?.key as string | undefined;

  return {
    genres,
    trailerKey: findTrailerKey('Trailer') || findTrailerKey('Teaser') || '',
  };
};

export const fetchSearch = async (
  query: string,
  category: SearchCategory,
  page: number
): Promise<SearchResponse> => {
  const params = new URLSearchParams({
    query,
    language: 'en-US',
    page: String(page),
  });

  if (category !== 'tv') {
    params.set('include_adult', 'false');
  }

  const data = await fetchJson(
    `${SEARCH_PATHS[category]}?${params.toString()}`,
    SEARCH_REVALIDATE_SECONDS
  );

  if (!isObject(data) || !Array.isArray(data.results)) {
    throw new TmdbUpstreamError(502);
  }

  const forcedMediaType = category === 'all' ? undefined : category;
  const results = dedupeMovies(
    data.results
      .map((item) => normalizeSearchResult(item, forcedMediaType))
      .filter((item): item is Movie => item !== null)
  );

  const upstreamPage = asNumber(data.page);
  const upstreamTotalPages = asNumber(data.total_pages);
  const currentPage =
    Number.isSafeInteger(upstreamPage) && upstreamPage > 0
      ? Math.min(upstreamPage, MAX_SEARCH_PAGE)
      : page;
  const totalPages =
    Number.isSafeInteger(upstreamTotalPages) && upstreamTotalPages > 0
      ? Math.min(upstreamTotalPages, MAX_SEARCH_PAGE)
      : currentPage;

  return {
    results,
    page: currentPage,
    totalPages,
    hasMore: currentPage < totalPages,
  };
};
