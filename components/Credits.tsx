import Image from 'next/image';

const Credits = () => (
  <section
    aria-labelledby='credits-heading'
    className='mr-4 mt-12 border-t border-white/10 pt-6 pb-4 md:mr-8 md:mt-16'
  >
    <h2 id='credits-heading' className='text-sm font-semibold text-white'>
      Credits
    </h2>
    <div className='mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5'>
      <a
        href='https://www.themoviedb.org'
        target='_blank'
        rel='noopener noreferrer'
        aria-label='Visit The Movie Database (TMDB)'
        className='inline-flex rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#01b4e4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#010511]'
      >
        <Image
          src='/assets/images/tmdb-logo.svg'
          alt='TMDB logo'
          width={154}
          height={20}
          unoptimized
          className='h-auto w-24 sm:w-28'
        />
      </a>
      <p className='max-w-2xl text-xs leading-relaxed text-gray-300 sm:text-sm'>
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
    </div>
  </section>
);

export default Credits;
