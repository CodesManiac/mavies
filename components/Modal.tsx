import { CloseCircle, Maximize2 } from 'iconsax-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactPlayer from 'react-player/lazy';
import { useRecoilState, useRecoilValue } from 'recoil';
import { modalState, movieState } from '../atoms/modalAtom';
import { keepFocusInside } from '../lib/focus';
import { Genre } from '../typings';

type TrailerStatus = 'loading' | 'ready' | 'unavailable';

// Iconsax does not expose a matching four-corner collapse icon.
const CollapseIcon = () => (
  <svg
    viewBox='0 0 24 24'
    width='22'
    height='22'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    <path d='M9 3v6H3' />
    <path d='M15 3v6h6' />
    <path d='M9 21v-6H3' />
    <path d='M15 21v-6h6' />
  </svg>
);

const Modal = () => {
  const [, setShowModal] = useRecoilState(modalState);
  const movie = useRecoilValue(movieState);
  const [trailer, setTrailer] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [status, setStatus] = useState<TrailerStatus>('loading');
  const trailerShellRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const orientationLockedRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canUseElementFullscreen, setCanUseElementFullscreen] = useState(false);
  const [canLockOrientation, setCanLockOrientation] = useState(false);
  const [mobileLike, setMobileLike] = useState(false);
  const [showRotationHint, setShowRotationHint] = useState(false);

  const releaseOrientation = useCallback(() => {
    if (
      orientationLockedRef.current &&
      typeof screen !== 'undefined' &&
      typeof screen.orientation?.unlock === 'function'
    ) {
      try {
        screen.orientation.unlock();
      } catch {
        setShowRotationHint(true);
      }
    }
    orientationLockedRef.current = false;
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') {
      return;
    }

    releaseOrientation();

    if (
      document.fullscreenElement === trailerShellRef.current &&
      typeof document.exitFullscreen === 'function'
    ) {
      try {
        await document.exitFullscreen();
      } catch {
        setShowRotationHint(true);
      }
    }

    setIsFullscreen(false);
  }, [releaseOrientation]);

  const requestLandscape = useCallback(async () => {
    if (!mobileLike || !canLockOrientation) {
      if (mobileLike) {
        setShowRotationHint(true);
      }
      return;
    }

    try {
      await screen.orientation.lock('landscape');
      orientationLockedRef.current = true;
    } catch {
      setShowRotationHint(true);
    }
  }, [canLockOrientation, mobileLike]);

  const enterFullscreen = useCallback(async () => {
    const element = trailerShellRef.current;

    if (!element || typeof document === 'undefined') {
      return;
    }

    if (document.fullscreenElement === element) {
      await exitFullscreen();
      return;
    }

    if (!canUseElementFullscreen || typeof element.requestFullscreen !== 'function') {
      setShowRotationHint(true);
      return;
    }

    try {
      await element.requestFullscreen();
      await requestLandscape();
    } catch {
      setShowRotationHint(true);
    }
  }, [canUseElementFullscreen, exitFullscreen, requestLandscape]);

  const handleClose = useCallback(() => {
    void exitFullscreen();
    setShowModal(false);
  }, [exitFullscreen, setShowModal]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      window.setTimeout(() => {
        previousFocusRef.current?.focus();
      }, 0);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();

        if (document.fullscreenElement === trailerShellRef.current) {
          void exitFullscreen();
          return;
        }

        handleClose();
        return;
      }

      if (event.key === 'Tab' && modalRef.current) {
        keepFocusInside(modalRef.current, event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [exitFullscreen, handleClose]);

  useEffect(() => {
    const element = trailerShellRef.current;

    setCanUseElementFullscreen(Boolean(
      element &&
        typeof document !== 'undefined' &&
        document.fullscreenEnabled &&
        typeof element.requestFullscreen === 'function'
    ));
    setCanLockOrientation(Boolean(
      typeof screen !== 'undefined' &&
        screen.orientation &&
        typeof screen.orientation.lock === 'function' &&
        typeof screen.orientation.unlock === 'function'
    ));
    setMobileLike(Boolean(
      typeof window !== 'undefined' &&
        (window.matchMedia?.('(pointer: coarse)').matches ||
          /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
    ));
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleFullscreenChange = () => {
      const active =
        document.fullscreenElement === trailerShellRef.current;
      setIsFullscreen(active);

      if (!active) {
        releaseOrientation();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);

      if (
        document.fullscreenElement === trailerShellRef.current &&
        typeof document.exitFullscreen === 'function'
      ) {
        void document.exitFullscreen().catch(() => {
          setShowRotationHint(true);
        });
      }

      releaseOrientation();
    };
  }, [releaseOrientation]);

  const youtubeConfig = useMemo(
    () => ({
      youtube: {
        playerVars: {
          playsinline: 1,
          fs: canUseElementFullscreen ? 0 : 1,
        },
      },
    }),
    [canUseElementFullscreen]
  );

  useEffect(() => {
    setTrailer('');
    setGenres([]);
    setShowRotationHint(false);

    if (!movie?.id) {
      setStatus('unavailable');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    const fetchMovie = async () => {
      try {
        const mediaType = movie.media_type === 'tv' ? 'tv' : 'movie';
        const response = await fetch(
          `/api/tmdb/details?mediaType=${mediaType}&id=${movie.id}`
        );

        if (!response.ok) {
          throw new Error('Movie details request failed');
        }

        const data: unknown = await response.json();

        if (typeof data !== 'object' || data === null) {
          throw new Error('Invalid movie details response');
        }

        const responseGenres = (data as { genres?: unknown }).genres;
        const nextGenres = Array.isArray(responseGenres)
          ? (responseGenres as Genre[])
          : [];
        const responseTrailerKey = (data as { trailerKey?: unknown }).trailerKey;
        const trailerKey =
          typeof responseTrailerKey === 'string' ? responseTrailerKey : '';

        if (cancelled) {
          return;
        }

        setGenres(nextGenres);
        setTrailer(trailerKey);
        setStatus(trailerKey ? 'ready' : 'unavailable');
      } catch {
        if (!cancelled) {
          setGenres([]);
          setTrailer('');
          setStatus('unavailable');
        }
      }
    };

    void fetchMovie();

    return () => {
      cancelled = true;
    };
  }, [movie]);

  const title =
    movie?.title || movie?.name || movie?.original_name || 'Movie details';
  const match =
    typeof movie?.vote_average === 'number'
      ? `${Math.round(movie.vote_average * 10)}% Match`
      : 'Rating unavailable';
  const releaseDate = movie?.release_date || movie?.first_air_date;
  const voteCount =
    typeof movie?.vote_count === 'number'
      ? movie.vote_count.toLocaleString()
      : 'Not available';
  const rotationHintVisible =
    showRotationHint ||
    (mobileLike && (!canUseElementFullscreen || !canLockOrientation));

  return (
    <div
      ref={modalRef}
      role='dialog'
      aria-modal='true'
      aria-label={`Details for ${title}`}
      className='modal-shell z-40 max-w-5xl rounded-lg bg-dark text-white scrollbar-hide'
    >
      <div
        ref={trailerShellRef}
        className='trailer-shell relative w-full pt-[56.25%]'
      >
        <div className='trailer-frame absolute inset-0'>
          {status === 'loading' && (
            <p
              role='status'
              className='absolute inset-0 grid place-content-center text-sm text-gray-300'
            >
              Loading trailer…
            </p>
          )}

          {status === 'unavailable' && (
            <p
              role='status'
              className='absolute inset-0 grid place-content-center px-6 text-center text-sm text-gray-300'
            >
              Trailer unavailable for this title.
            </p>
          )}

          {status === 'ready' && trailer && (
            <ReactPlayer
              url={`https://www.youtube.com/watch?v=${trailer}`}
              width='100%'
              height='100%'
              style={{ position: 'absolute', top: '0', left: '0' }}
              playing
              playsinline
              controls
              config={youtubeConfig}
            />
          )}

          <button
            ref={closeButtonRef}
            type='button'
            aria-label='Close movie details'
            title='Close details'
            onClick={handleClose}
            className='absolute top-2 right-2 z-50 grid h-11 w-11 place-items-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
          >
            <CloseCircle size='28' color='#ffffff' variant='Broken' />
          </button>

          {status === 'ready' && trailer && canUseElementFullscreen && (
            <button
              type='button'
              aria-label={
                isFullscreen ? 'Exit fullscreen trailer' : 'Enter fullscreen trailer'
              }
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              onClick={() => void enterFullscreen()}
              className='absolute right-2 bottom-2 z-50 grid h-11 w-11 place-items-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
            >
              {isFullscreen ? (
                <CollapseIcon />
              ) : (
                <Maximize2 size='22' color='#ffffff' variant='Broken' />
              )}
            </button>
          )}
        </div>

        {isFullscreen && rotationHintVisible && (
          <p
            role='status'
            className='absolute top-4 left-1/2 z-50 -translate-x-1/2 rounded bg-black/60 px-3 py-1.5 text-center text-xs text-gray-200'
          >
            Rotate your device for a better viewing experience.
          </p>
        )}
      </div>

      {!isFullscreen && rotationHintVisible && (
        <p role='status' className='px-4 pt-2 text-center text-xs text-gray-300'>
          Rotate your device for a better viewing experience.
        </p>
      )}

      <div className='grid gap-y-2 p-4'>
        <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm'>
          <p className='font-semibold text-[#a78bfa]'>{match}</p>
          {releaseDate && <p>{releaseDate}</p>}
          <p>HD</p>
        </div>

        <p className='text-sm'>{movie?.overview || 'No description available.'}</p>
        <p className='text-sm'>
          <span className='font-semibold'>Genre: </span>
          {genres.length > 0
            ? genres.map((genre) => genre.name).join(', ')
            : 'Not available'}
        </p>
        <p className='text-sm'>
          <span className='font-semibold'>Original Language: </span>
          {movie?.original_language || 'Not available'}
        </p>
        <p className='text-sm'>
          <span className='font-semibold'>Total Votes: </span>
          {voteCount}
        </p>
      </div>
    </div>
  );
};

export default Modal;
