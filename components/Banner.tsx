import React, { useEffect, useState } from 'react';
import { InfoCircle, PlayCircle } from 'iconsax-react';
import Image from 'next/image';
import { useRecoilState } from 'recoil';
import { modalState, movieState } from '../atoms/modalAtom';
import { baseUrl } from '../constants/movie';
import { Movie } from '../typings';

interface Props {
  netflixOriginals: Movie[];
}

const Banner = ({ netflixOriginals }: Props) => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [, setShowModal] = useRecoilState(modalState);
  const [, setCurrentMovie] = useRecoilState(movieState);

  useEffect(() => {
    const safeMovies = Array.isArray(netflixOriginals) ? netflixOriginals : [];
    setMovie(
      safeMovies.length > 0
        ? safeMovies[Math.floor(Math.random() * safeMovies.length)]
        : null
    );
  }, [netflixOriginals]);

  if (!movie) {
    return (
      <div className='flex flex-col space-y-2 py-16 md:space-y-4 md:py-32'>
        <h1 className='text-2xl font-bold md:text-4xl lg:text-7xl'>
          Featured title unavailable
        </h1>
        <p className='max-w-lg text-sm text-gray-300 md:text-lg'>
          The featured movie could not be loaded. Browse the categories below.
        </p>
      </div>
    );
  }

  const title = movie.title || movie.name || movie.original_name || 'Untitled';
  const imagePath = movie.backdrop_path || movie.poster_path;

  const openDetails = () => {
    setCurrentMovie(movie);
    setShowModal(true);
  };

  return (
    <div className='flex flex-col space-y-2 py-16 md:space-y-4 md:py-32 lg:h-[65vh] lg:justify-end lg:pb-12'>
      {imagePath && (
        <div className='absolute top-0 left-0 -z-10 h-[95vh] w-screen'>
          <Image
            src={`${baseUrl}${imagePath}`}
            alt={`${title} backdrop`}
            fill
            sizes='100vw'
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
      )}

      <h1 className='text-2xl font-bold md:text-4xl lg:text-7xl'>{title}</h1>
      <p className='max-w-xs text-xs md:max-w-lg md:text-lg lg:max-w-2xl lg:text-2xl'>
        {movie.overview}
      </p>

      <div className='flex space-x-3'>
        <button
          type='button'
          onClick={openDetails}
          className='banner-button bg-dark hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
        >
          <PlayCircle size='24' color='#ffffff' /> Play
        </button>
        <button
          type='button'
          onClick={openDetails}
          className='banner-button bg-primary hover:bg-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
        >
          <InfoCircle size='24' color='#ffffff' />
          More Details
        </button>
      </div>
    </div>
  );
};

export default Banner;
