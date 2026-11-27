import React from 'react';
import Image from 'next/image';
import { Movie } from '../typings';
import { modalState, movieState } from '../atoms/modalAtom';
import { useRecoilState } from 'recoil';

interface Props {
  movie: Movie;
}

const Thumbnail = ({ movie }: Props) => {
  const [, setCurrentMovie] = useRecoilState(movieState);
  const [, setShowModal] = useRecoilState(modalState);

  if (!movie) {
    return null;
  }

  const title = movie.title || movie.name || movie.original_name || 'Untitled';
  const imagePath = movie.backdrop_path || movie.poster_path;

  return (
    <button
      type='button'
      aria-label={`View details for ${title}`}
      onClick={() => {
        setCurrentMovie(movie);
        setShowModal(true);
      }}
      className='relative h-28 min-w-[180px] cursor-pointer text-left transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:h-36 md:min-w-[260px] md:hover:scale-105'
    >
      {imagePath ? (
        <Image
          src={`https://image.tmdb.org/t/p/w500${imagePath}`}
          alt={title}
          className='rounded-sm object-cover md:rounded'
          fill
          sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw'
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <span className='flex h-full w-full items-center rounded-sm bg-white/10 px-3 text-xs text-white md:rounded'>
          {title}
        </span>
      )}
    </button>
  );
};

export default Thumbnail;
