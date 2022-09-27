import { ArrowCircleLeft, ArrowCircleRight } from 'iconsax-react';
import React from 'react';
import { Movie } from '../typings';

interface Props {
  title: string;
  movies: Movie[];
}
const Row = ({ title, movies }: Props) => {
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
          className='row-arrow left-2'
        />

        <ArrowCircleRight
          size='32'
          color='#ffffff'
          className='row-arrow right-2'
        />
      </div>
    </div>
  );
};

export default Row;
