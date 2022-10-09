import { ArrowCircleLeft, ArrowCircleRight } from 'iconsax-react';
import React, { useRef, useState } from 'react';
import { Movie } from '../typings';
import Thumbnail from './Thumbnail';

interface Props {
  title: string;
  movies: Movie[];
}
const Row = ({ title, movies }: Props) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [slideIsMoved, setSlideIsMoved] = useState(false);

  const handleClick = (direction: string) => {
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
    <div className='h-40 space-y-0.5 md:space-y-2'>
      {' '}
      <h2 className='w-56 cursor-pointer text-sm font-semibold text-[#e5e5e5] transition duration-200 hover:text-white md:text-2xl'>
        {title}
      </h2>
      <div className='group relative md:-ml-2'>
        <ArrowCircleLeft
          size='32'
          color='#FFffff'
          className={`row-arrow left-2 ${!slideIsMoved && 'hidden'}`}
          onClick={() => handleClick('left')}
        />
        <div
          ref={rowRef}
          className='flex items-center space-x-0.5 overflow-x-scroll scrollbar-hide md:space-x-2.5 md:p-2'
        >
          {movies.map((movie) => (
            <Thumbnail key={movie.id} movie={movie} />
          ))}
        </div>
        <ArrowCircleRight
          size='32'
          color='#ffffff'
          className='row-arrow right-2'
          onClick={() => handleClick('right')}
        />
      </div>
    </div>
  );
};

export default Row;
