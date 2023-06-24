import Link from 'next/link';
import { Logout, Notification, SearchNormal1, User } from 'iconsax-react';
import { useEffect, useState } from 'react';
import { headerData } from '../typings';
import userAuth from '../hooks/userAuth';
import { useUserLocation } from '../utils/userLocation';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { logout } = userAuth();
  const currentLocation: string = useUserLocation();

  const headerData: headerData[] = [
    {
      id: 1,
      title: 'Movies',
      url: '/',
    },
    {
      id: 2,
      title: 'Tv Shows',
      url: '/',
    },
    {
      id: 3,
      title: 'New & Popular',
      url: '/',
    },
    {
      id: 4,
      title: 'My List',
      url: '/',
    },
  ];

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
      <div className='flex justify-between items-center gap-8'>
        <h1 className='bg-clip-text font-bold text-xl text-transparent bg-gradient-to-r from-[#ea4996] to-[#8d56f4]'>
          Mavies
        </h1>
        <div className='hidden md:flex md:gap-5'>
          {headerData.filter((element) => currentLocation === 'Nigeria' || element.id !== 3).map((data) => (
            <a
              key={data.id}
              href={data.url}
              className='py-2 px-4 rounded-lg font-semibold hover:-translate-y-1 hover:scale-110 hover:bg-dark duration-300'
            >
              {data.title}
            </a>
          ))}
        </div>
      </div>
      <div className='flex items-center space-x-4 text-sm font-light'>
        <SearchNormal1
          color='#ffffff'
          className='sm hidden h-6 w-6 sm:inline'
        />
        <p className='hidden lg:inline cursor-pointer' onClick={logout}>
          <Logout size='32' color='#ffffff' />
        </p>
        <Notification color='#ffffff' className='h-6 w-6 cursor-pointer' />
        <Link href='/account'>
          <User color='#ffffff' className=' rounded cursor-pointer' />
        </Link>
      </div>
    </header>
  );
};

export default Header;
