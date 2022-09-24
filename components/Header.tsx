import Link from 'next/link';
import { Notification, SearchNormal1, User } from 'iconsax-react';
import { useEffect, useState } from 'react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  return (
    <header className={`${isScrolled && 'bg-main-background'}`}>
      <div className='flex justify-between items-center '>
        <h1 className='bg-clip-text font-bold text-xl text-transparent bg-gradient-to-r from-[#ea4996] to-[#8d56f4]'>
          Mavies
        </h1>
        <div className='hidden md:flex md:gap-5'>
          {[
            ['Home', '/'],
            ['Movies', '/'],
            ['Tv Shows', '/'],
            ['New & Popular', '/'],
            ['My List', '/'],
          ].map(([title, url]) => (
            <a
              key={url}
              href={url}
              className='py-2 px-4 rounded-lg font-semibold hover:-translate-y-1 hover:scale-110 hover:bg-dark duration-300'
            >
              {title}
            </a>
          ))}
        </div>
      </div>
      <div className='flex items-center space-x-4 text-sm font-light'>
        <SearchNormal1
          color='#ffffff'
          className='sm hidden h-6 w-6 sm:inline'
        />
        <p className='hidden lg:inline'>Kids</p>
        <Notification color='#ffffff' className='h-6 w-6 cursor-pointer' />
        <Link href='/account'>
          <User color='#ffffff' className=' rounded cursor-pointer' />
        </Link>
      </div>
    </header>
  );
};

export default Header;
