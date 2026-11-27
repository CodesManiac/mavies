import Image from 'next/image';
import React from 'react';
import { useRecoilState } from 'recoil';
import { modalState, movieState } from '../atoms/modalAtom';
import type { Movie } from '../typings';

interface Props {
  movie: Movie;
  onOpen?: () => void;
}

const SearchResultCard = ({ movie, onOpen }: Props) => {
  const [, setCurrentMovie] = useRecoilState(movieState);
  const [, setShowModal] = useRecoilState(modalState);

  if (!movie) {
    return null;
  }

  const title =
    movie.title || movie.name || movie.original_name || 'Untitled';
  const classification = movie.media_type === 'tv' ? 'TV Show' : 'Movie';
  const date = movie.release_date || movie.first_air_date || '';
  const year = /^\d{4}$/.test(date.slice(0, 4)) ? date.slice(0, 4) : '';
  const imagePath = movie.backdrop_path || movie.poster_path;

  return (
    <button
      type='button'
      data-search-result-key={`${movie.media_type || 'movie'}:${movie.id}`}
      aria-label={`View details for ${title}, ${classification}`}
      aria-haspopup='dialog'
      onClick={(event) => {
        event.currentTarget.focus();
        onOpen?.();
        setCurrentMovie(movie);
        setShowModal(true);
      }}
      className='group flex min-w-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-white/5 text-left transition duration-200 ease-out hover:scale-[1.02] hover:border-white/25 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa] motion-reduce:transform-none motion-reduce:transition-none'
    >
      <span className='relative block aspect-video w-full overflow-hidden bg-white/10'>
        {imagePath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w500${imagePath}`}
            alt={`${title} thumbnail`}
            fill
            loading='lazy'
            sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw'
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <span className='flex h-full w-full items-center justify-center px-3 text-center text-xs text-gray-300'>
            Image unavailable
          </span>
        )}
      </span>

      <span className='flex min-h-[3.5rem] min-w-0 flex-col gap-0.5 px-2.5 py-2'>
        <span className='line-clamp-2 break-words text-sm font-semibold leading-tight text-white'>
          {title}
        </span>
        <span className='mt-auto flex flex-wrap items-center gap-x-2 text-[11px] text-gray-300'>
          <span>{classification}</span>
          {year && (
            <>
              <span aria-hidden='true'>•</span>
              <span>{year}</span>
            </>
          )}
        </span>
      </span>
    </button>
  );
};

export default SearchResultCard;
