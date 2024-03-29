import React, { useEffect, useState } from 'react';
import { baseUrl } from '../constants/movie';
import { Movie } from '../typings';
import Image from 'next/image';
import { InfoCircle, PlayCircle } from 'iconsax-react';
import { modalState, movieState } from '../atoms/modalAtom';
import { useRecoilState } from 'recoil';

interface Props {
  netflixOriginals: Movie[];
}
const Banner = ({ netflixOriginals }: Props) => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showModal, setShowModal] = useRecoilState(modalState);
  const [currentMovie, setCurrentMovie] = useRecoilState(movieState);
  useEffect(() => {
    setMovie(
      netflixOriginals[Math.floor(Math.random() * netflixOriginals.length)]
    );
  }, [netflixOriginals]);
  // console.log(movie);

  return (
    <div className='flex flex-col space-y-2 py-16  md:py-32 md:space-y-4 lg:h-[65vh] lg:justify-end lg:pb-12'>
      <div className='absolute  top-0 left-0 h-[95vh] -z-10 w-screen'>
        <Image
          src={`${baseUrl}${movie?.backdrop_path || movie?.poster_path}`}
          layout='fill'
          objectFit='cover'
          priority
        />
      </div>
      <h1 className='font-bold text-2xl md:text-4xl lg:text-7xl '>
        {movie?.title || movie?.name || movie?.original_name}
      </h1>
      <p className='max-w-xs text-xs  md:max-w-lg md:text-lg lg:max-w-2xl lg:text-2xl'>
        {movie?.overview}
      </p>
      <div className='flex  space-x-3'>
        <button className='banner-button bg-dark hover:bg-primary'>
          <PlayCircle size='24' color='#ffffff' /> Play
        </button>
        <button
          className='banner-button bg-primary hover:bg-dark'
          onClick={() => {
            setCurrentMovie(movie);
            setShowModal(true);
          }}
        >
          <InfoCircle size='24' color='#ffffff' />
          More Details
        </button>
      </div>
    </div>
  );
};

export default Banner;
