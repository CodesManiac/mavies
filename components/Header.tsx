import { LogoutCurve, SearchNormal1 } from 'iconsax-react';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { searchModalState } from '../atoms/modalAtom';
import userAuth from '../hooks/userAuth';
import { headerData } from '../typings';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [, setSearchOpen] = useRecoilState(searchModalState);
  const { logout, submitting } = userAuth();

  const navigation: headerData[] = [
    { id: 1, title: 'Movies', url: '/' },
    { id: 2, title: 'New & Popular', url: '/#trending-now' },
    { id: 3, title: 'Top Rated', url: '/#top-rated' },
    { id: 4, title: 'Documentaries', url: '/#documentaries' },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${isScrolled && 'bg-main-background'}`}>
      <div className='flex items-center justify-between gap-8'>
        <h1 className='bg-gradient-to-r from-[#ea4996] to-[#8d56f4] bg-clip-text text-xl font-bold text-transparent'>
          Mavies
        </h1>

        <nav aria-label='Main navigation' className='hidden gap-5 md:flex'>
          {navigation.map((item) => (
            <a
              key={item.id}
              href={item.url}
              className='rounded-lg px-4 py-2 font-semibold transition duration-300 hover:-translate-y-1 hover:scale-110 hover:bg-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d56f4]'
            >
              {item.title}
            </a>
          ))}
        </nav>
      </div>

      <div className='flex items-center gap-2 text-sm font-light sm:gap-4'>
        <button
          id='search-trigger'
          type='button'
          aria-label='Search movies and TV shows'
          aria-haspopup='dialog'
          title='Search'
          onClick={() => setSearchOpen(true)}
          className='grid h-11 w-11 place-items-center rounded-full transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transition-none'
        >
          <SearchNormal1 size='26' color='#ffffff' variant='Broken' />
        </button>
        <button
          type='button'
          aria-label='Sign out'
          title='Sign out'
          onClick={() => void logout()}
          disabled={submitting}
          className='grid h-11 w-11 place-items-center rounded-full transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60'
        >
          <LogoutCurve size='28' color='#ffffff' variant='Broken' />
        </button>
      </div>
    </header>
  );
};

export default Header;
