import { ArrowLeft, CloseCircle } from 'iconsax-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { modalState, searchModalState } from '../atoms/modalAtom';
import { keepFocusInside, setElementInert } from '../lib/focus';
import type { Movie, SearchCategory, SearchResponse } from '../typings';
import SearchResultCard from './SearchResultCard';

interface Props {
  trendingNow: Movie[];
}

type SearchStatus = 'idle' | 'loading' | 'ready' | 'error';
type ErrorKind = 'rate-limit' | 'timeout' | 'service';

const FILTERS: { value: SearchCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'TV Shows' },
];

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 400;

const ERROR_MESSAGES: Record<ErrorKind, string> = {
  'rate-limit': 'Search is rate limited. Please wait before trying again.',
  timeout: 'The search request timed out. Please try again.',
  service: 'Search is temporarily unavailable. Please try again.',
};

const classifyStatus = (status: number): ErrorKind => {
  if (status === 429) {
    return 'rate-limit';
  }

  if (status === 504) {
    return 'timeout';
  }

  return 'service';
};

const dedupeResults = (movies: Movie[]): Movie[] => {
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

const parseSearchResponse = (data: unknown): SearchResponse | null => {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const response = data as Partial<SearchResponse>;

  if (
    !Array.isArray(response.results) ||
    typeof response.page !== 'number' ||
    typeof response.totalPages !== 'number' ||
    typeof response.hasMore !== 'boolean'
  ) {
    return null;
  }

  const validResults = response.results.filter((item): item is Movie => {
    if (typeof item !== 'object' || item === null) {
      return false;
    }

    const result = item as Partial<Movie>;
    return (
      typeof result.id === 'number' &&
      Number.isSafeInteger(result.id) &&
      (result.media_type === 'movie' || result.media_type === 'tv')
    );
  });

  return {
    results: dedupeResults(validResults),
    page: response.page,
    totalPages: response.totalPages,
    hasMore: response.hasMore,
  };
};

const SearchModal = ({ trendingNow }: Props) => {
  const [, setSearchOpen] = useRecoilState(searchModalState);
  const detailsOpen = useRecoilValue(modalState);
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [filter, setFilter] = useState<SearchCategory>('all');
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [errorKind, setErrorKind] = useState<ErrorKind>('service');
  const [results, setResults] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<ErrorKind | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(
    null
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const requestSequence = useRef(0);
  const searchController = useRef<AbortController | null>(null);
  const pageController = useRef<AbortController | null>(null);
  const openedResultKey = useRef<string | null>(null);
  const detailsWereOpen = useRef(false);

  const trimmedQuery = query.trim();
  const hasActiveQuery = activeQuery.length >= MIN_QUERY_LENGTH;
  const needsMoreCharacters =
    trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH;
  const showingTrending = status === 'idle';
  const visibleResults = useMemo(() => {
    if (!showingTrending) {
      return results;
    }

    const catalogue = Array.isArray(trendingNow) ? trendingNow : [];

    return dedupeResults(
      catalogue.filter((movie) => {
        if (!movie || movie.adult === true) {
          return false;
        }

        if (movie.media_type !== 'movie' && movie.media_type !== 'tv') {
          return false;
        }

        if (filter !== 'all' && movie.media_type !== filter) {
          return false;
        }

        return Number.isSafeInteger(movie.id) && movie.id > 0;
      })
    );
  }, [filter, showingTrending, results, trendingNow]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, [setSearchOpen]);

  const rememberOpenedResult = (movie: Movie) => {
    openedResultKey.current = `${movie.media_type || 'movie'}:${movie.id}`;
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = Math.max(
      0,
      window.innerWidth - document.documentElement.clientWidth
    );

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      searchController.current?.abort();
      pageController.current?.abort();
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.setTimeout(() => {
        document.getElementById('search-trigger')?.focus();
      }, 0);
    };
  }, []);

  useEffect(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setActiveQuery('');
      return;
    }

    const timer = window.setTimeout(() => {
      setActiveQuery(trimmedQuery);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [trimmedQuery]);

  useEffect(() => {
    const visualViewport = window.visualViewport;

    if (!visualViewport) {
      return;
    }

    const update = () => {
      setViewport({
        height: Math.max(240, Math.round(visualViewport.height)),
        top: Math.round(visualViewport.offsetTop),
      });
    };

    update();
    visualViewport.addEventListener('resize', update);
    visualViewport.addEventListener('scroll', update);

    return () => {
      visualViewport.removeEventListener('resize', update);
      visualViewport.removeEventListener('scroll', update);
    };
  }, []);

  useEffect(() => {
    setElementInert(panelRef.current, detailsOpen);

    if (detailsOpen && panelRef.current?.contains(document.activeElement)) {
      (document.activeElement as HTMLElement).blur();
    }
  }, [detailsOpen]);

  useEffect(() => {
    if (detailsWereOpen.current && !detailsOpen && openedResultKey.current) {
      const key = openedResultKey.current;
      const focusTimer = window.setTimeout(() => {
        panelRef.current
          ?.querySelector<HTMLElement>(`[data-search-result-key="${key}"]`)
          ?.focus();
      }, 50);

      detailsWereOpen.current = detailsOpen;
      return () => window.clearTimeout(focusTimer);
    }

    detailsWereOpen.current = detailsOpen;
  }, [detailsOpen]);

  useEffect(() => {
    if (detailsOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSearch();
        return;
      }

      if (event.key === 'Tab' && panelRef.current) {
        keepFocusInside(panelRef.current, event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeSearch, detailsOpen]);

  useEffect(() => {
    requestSequence.current += 1;
    const sequence = requestSequence.current;

    searchController.current?.abort();
    pageController.current?.abort();
    setLoadingMore(false);
    setLoadMoreError(null);
    setPage(1);
    setTotalPages(1);
    setHasMore(false);

    if (!hasActiveQuery) {
      searchController.current = null;
      setResults([]);
      setStatus('idle');
      return;
    }

    setResults([]);
    setStatus('loading');

    const controller = new AbortController();
    searchController.current = controller;

    const loadResults = async () => {
      try {
        const params = new URLSearchParams({
          q: activeQuery,
          type: filter,
          page: '1',
        });
        const response = await fetch(`/api/tmdb/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (sequence !== requestSequence.current) {
          return;
        }

        if (!response.ok) {
          setResults([]);
          setErrorKind(classifyStatus(response.status));
          setStatus('error');
          return;
        }

        const data: unknown = await response.json();

        if (sequence !== requestSequence.current) {
          return;
        }

        const parsed = parseSearchResponse(data);

        if (!parsed) {
          throw new Error('Invalid search response');
        }

        setResults(parsed.results);
        setPage(parsed.page);
        setTotalPages(parsed.totalPages);
        setHasMore(parsed.hasMore);
        setStatus('ready');
      } catch {
        if (sequence !== requestSequence.current || controller.signal.aborted) {
          return;
        }

        setResults([]);
        setErrorKind('service');
        setStatus('error');
      }
    };

    void loadResults();

    return () => controller.abort();
  }, [activeQuery, filter, hasActiveQuery, retryKey]);

  useEffect(() => {
    resultsRef.current?.scrollTo({ top: 0 });
  }, [activeQuery, filter]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || !hasActiveQuery || page >= totalPages) {
      return;
    }

    const sequence = requestSequence.current;
    const controller = new AbortController();
    pageController.current = controller;
    setLoadingMore(true);
    setLoadMoreError(null);

    try {
      const params = new URLSearchParams({
        q: activeQuery,
        type: filter,
        page: String(page + 1),
      });
      const response = await fetch(`/api/tmdb/search?${params.toString()}`, {
        signal: controller.signal,
      });

      if (sequence !== requestSequence.current) {
        return;
      }

      if (!response.ok) {
        setLoadMoreError(classifyStatus(response.status));
        return;
      }

      const data: unknown = await response.json();

      if (sequence !== requestSequence.current) {
        return;
      }

      const parsed = parseSearchResponse(data);

      if (!parsed) {
        throw new Error('Invalid search response');
      }

      setResults((current) => dedupeResults([...current, ...parsed.results]));
      setPage(parsed.page);
      setTotalPages(parsed.totalPages);
      setHasMore(parsed.hasMore);
    } catch {
      if (sequence === requestSequence.current && !controller.signal.aborted) {
        setLoadMoreError('service');
      }
    } finally {
      if (sequence === requestSequence.current) {
        setLoadingMore(false);
        pageController.current = null;
      }
    }
  };

  const changeFilter = (nextFilter: SearchCategory) => {
    if (nextFilter === filter) {
      return;
    }

    searchController.current?.abort();
    pageController.current?.abort();
    setFilter(nextFilter);
    setResults([]);
    setPage(1);
    setTotalPages(1);
    setHasMore(false);
    setLoadMoreError(null);
  };

  const title =
    status === 'loading'
      ? 'Searching…'
      : status === 'error'
        ? 'Search unavailable'
        : showingTrending
          ? 'Trending Now'
          : `Search results for “${activeQuery}”`;

  const liveMessage =
    status === 'loading'
      ? 'Searching for titles.'
      : status === 'error'
        ? ERROR_MESSAGES[errorKind]
        : status === 'ready'
          ? 'Search results updated.'
          : '';

  return (
    <div className='fixed inset-0 z-[35]'>
      <div
        aria-hidden='true'
        onClick={() => {
          if (!detailsOpen) {
            closeSearch();
          }
        }}
        className='absolute inset-0 bg-black/70 backdrop-blur-sm'
      />

      <div
        ref={panelRef}
        role='dialog'
        aria-modal={!detailsOpen}
        aria-label='Search movies and TV shows'
        tabIndex={-1}
        style={
          viewport
            ? { height: `${viewport.height}px`, top: `${viewport.top}px` }
            : undefined
        }
        className='search-shell absolute inset-x-0 top-0 z-20 mx-auto flex w-full max-w-full flex-col overflow-hidden bg-dark text-white shadow-2xl md:inset-x-auto md:left-1/2 md:right-auto md:w-[82vw] md:max-w-[1280px] md:-translate-x-1/2 md:border-x md:border-white/10'
      >
        <div className='search-header sticky top-0 z-20 flex shrink-0 flex-col border-b border-white/10 bg-dark/95 px-3 pb-3 backdrop-blur'>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              aria-label='Close search'
              title='Close search'
              onClick={closeSearch}
              className='grid h-11 w-11 shrink-0 place-items-center rounded-full transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none'
            >
              <ArrowLeft size='28' color='#ffffff' variant='Broken' />
            </button>

            <div className='relative min-w-0 flex-1'>
              <input
                ref={inputRef}
                type='text'
                value={query}
                maxLength={100}
                placeholder='Search movies and TV shows'
                aria-label='Search movies and TV shows'
                onChange={(event) => setQuery(event.target.value.slice(0, 100))}
                className='h-11 w-full rounded-lg border border-white/10 bg-white/10 px-4 pr-12 text-sm text-white placeholder:text-gray-400 focus:border-[#a78bfa] focus:outline-none focus:ring-1 focus:ring-[#a78bfa]'
              />

              {query.length > 0 && (
                <button
                  type='button'
                  aria-label='Clear search input'
                  title='Clear input'
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className='absolute top-0 right-0 grid h-11 w-11 place-items-center rounded-full text-gray-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none'
                >
                  <CloseCircle size='22' color='#ffffff' variant='Broken' />
                </button>
              )}
            </div>
          </div>

          <div
            role='group'
            aria-label='Search categories'
            className='mt-3 flex flex-nowrap items-center gap-2 whitespace-nowrap'
          >
            {FILTERS.map((option) => {
              const selected = filter === option.value;

              return (
                <button
                  key={option.value}
                  type='button'
                  aria-pressed={selected}
                  onClick={() => changeFilter(option.value)}
                  className={`h-11 shrink-0 rounded-full px-4 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none ${
                    selected
                      ? 'bg-[#a78bfa] text-dark'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <p role='status' aria-live='polite' aria-atomic='true' className='sr-only'>
          {liveMessage}
        </p>

        <div
          ref={resultsRef}
          role='region'
          aria-label='Search results'
          aria-busy={status === 'loading'}
          className='search-results min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pt-4'
        >
          <div className='mx-auto max-w-[1600px]'>
            <h2 className='mb-4 text-lg font-semibold text-white sm:text-xl'>
              {title}
            </h2>

            {needsMoreCharacters && (
              <p className='rounded-lg bg-white/10 px-4 py-3 text-sm text-gray-200'>
                Enter at least two characters to search.
              </p>
            )}

            {status === 'loading' && (
              <div
                aria-hidden='true'
                className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'
              >
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className='animate-pulse overflow-hidden rounded-lg border border-white/5 bg-white/5 motion-reduce:animate-none'
                  >
                    <div className='aspect-video w-full bg-white/10' />
                    <div className='space-y-2 p-2.5'>
                      <div className='h-3 w-4/5 rounded bg-white/10' />
                      <div className='h-2 w-1/2 rounded bg-white/10' />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showingTrending &&
              !needsMoreCharacters &&
              (visibleResults.length > 0 ? (
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
                  {visibleResults.map((movie) => (
                    <SearchResultCard
                      key={`${movie.media_type || 'movie'}-${movie.id}`}
                      movie={movie}
                      onOpen={() => rememberOpenedResult(movie)}
                    />
                  ))}
                </div>
              ) : (
                <p className='rounded-lg bg-white/10 px-4 py-3 text-sm text-gray-200'>
                  Trending titles are unavailable right now. Try a search instead.
                </p>
              ))}

            {status === 'ready' &&
              (results.length > 0 ? (
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
                  {results.map((movie) => (
                    <SearchResultCard
                      key={`${movie.media_type || 'movie'}-${movie.id}`}
                      movie={movie}
                      onOpen={() => rememberOpenedResult(movie)}
                    />
                  ))}
                </div>
              ) : (
                <p className='rounded-lg bg-white/10 px-4 py-3 text-sm text-gray-200'>
                  {hasMore
                    ? 'No titles on this page. Load more or change your search or category.'
                    : 'No results found. Try a different query or category.'}
                </p>
              ))}

            {status === 'error' && (
              <div className='rounded-lg bg-white/10 px-4 py-4'>
                <p role='alert' className='text-sm text-gray-200'>
                  {ERROR_MESSAGES[errorKind]}
                </p>
                <button
                  type='button'
                  onClick={() => setRetryKey((value) => value + 1)}
                  className='mt-3 h-11 rounded-full bg-[#a78bfa] px-5 text-sm font-semibold text-dark transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none'
                >
                  Retry search
                </button>
              </div>
            )}

            {status === 'ready' && hasMore && (
              <div className='mt-6 flex flex-col items-center gap-3'>
                {loadMoreError && (
                  <p role='alert' className='text-center text-sm text-gray-200'>
                    {ERROR_MESSAGES[loadMoreError]}{' '}
                    <button
                      type='button'
                      onClick={() => void loadMore()}
                      className='font-semibold text-[#a78bfa] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
                    >
                      Retry
                    </button>
                  </p>
                )}

                <button
                  type='button'
                  disabled={loadingMore}
                  onClick={() => void loadMore()}
                  className='h-11 rounded-full bg-white/10 px-6 text-sm font-semibold transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none'
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
