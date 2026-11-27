import { ArrowCircleLeft, ArrowCircleRight } from 'iconsax-react';
import React, { useRef, useState } from 'react';
import { Movie } from '../typings';
import Thumbnail from './Thumbnail';

interface Props {
  id?: string;
  title: string;
  movies: Movie[];
}

const Row = ({ id, title, movies }: Props) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [slideIsMoved, setSlideIsMoved] = useState(false);
  const safeMovies = Array.isArray(movies) ? movies : [];

  const handleClick = (direction: 'left' | 'right') => {
    setSlideIsMoved(true);

    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollDirection =
        direction === 'left'
          ? scrollLeft - clientWidth
          : scrollLeft + clientWidth;

      rowRef.current.scrollTo({ left: scrollDirection, behavior: 'smooth' });
    }
  };

  return (
    <div id={id} className='h-40 scroll-mt-24 space-y-0.5 md:space-y-2'>
      <h2 className='w-56 text-sm font-semibold text-[#e5e5e5] md:text-2xl'>
        {title}
      </h2>

      {safeMovies.length === 0 ? (
        <p className='pt-6 text-sm text-gray-300'>
          No titles are available in this category right now.
        </p>
      ) : (
        <div className='group relative md:-ml-2'>
          <button
            type='button'
            aria-label={`Scroll ${title} left`}
            onClick={() => handleClick('left')}
            className={`row-arrow left-2 rounded-full focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
              slideIsMoved ? '' : 'hidden'
            }`}
          >
            <ArrowCircleLeft size='32' color='#ffffff' />
          </button>

          <div
            ref={rowRef}
            className='flex items-center space-x-0.5 overflow-x-scroll scrollbar-hide md:space-x-2.5 md:p-2'
          >
            {safeMovies.map((movie) => (
              <Thumbnail key={movie.id} movie={movie} />
            ))}
          </div>

          <button
            type='button'
            aria-label={`Scroll ${title} right`}
            onClick={() => handleClick('right')}
            className='row-arrow right-2 rounded-full focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none'
          >
            <ArrowCircleRight size='32' color='#ffffff' />
          </button>
        </div>
      )}
    </div>
  );
};

export default Row;
