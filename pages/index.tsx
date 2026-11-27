import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import Banner from '../components/Banner';
import Credits from '../components/Credits';
import Header from '../components/Header';
import Modal from '../components/Modal';
import Row from '../components/Row';
import SearchModal from '../components/SearchModal';
import userAuth from '../hooks/userAuth';
import { setElementInert } from '../lib/focus';
import { Movie } from '../typings';
import { modalState, searchModalState } from './../atoms/modalAtom';

interface Props {
  netflixOriginals: Movie[];
  trendingNow: Movie[];
  topRated: Movie[];
  actionMovies: Movie[];
  comedyMovies: Movie[];
  horrorMovies: Movie[];
  romanceMovies: Movie[];
  documentaries: Movie[];
}

const Home = ({
  netflixOriginals,
  trendingNow,
  topRated,
  actionMovies,
  comedyMovies,
  horrorMovies,
  romanceMovies,
  documentaries,
}: Props) => {
  const { user, initializing } = userAuth();
  const router = useRouter();
  const showModal = useRecoilValue(modalState);
  const searchOpen = useRecoilValue(searchModalState);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initializing && !user) {
      void router.replace('/login');
    }
  }, [initializing, user, router]);

  useEffect(() => {
    setElementInert(contentRef.current, showModal || searchOpen);
    return () => setElementInert(contentRef.current, false);
  }, [showModal, searchOpen]);

  if (initializing || !user) {
    return (
      <div
        role='status'
        aria-label='Restoring your session'
        className='grid h-screen w-screen place-content-center content-center'
      >
        <div
          aria-hidden='true'
          className='h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white'
        />
      </div>
    );
  }

  const hasCatalogue = [
    netflixOriginals,
    trendingNow,
    topRated,
    actionMovies,
    comedyMovies,
    horrorMovies,
    romanceMovies,
    documentaries,
  ].some((items) => items.length > 0);

  return (
    <>
      <div
        ref={contentRef}
        className={`relative h-screen overflow-x-hidden bg-gradient-to-br from-primary/10 to-[#010511] lg:h-[140vh] ${
          showModal || searchOpen ? 'h-screen overflow-hidden' : ''
        }`}
      >
        <Head>
          <title>Mavies</title>
          <link rel='icon' href='/favicon.ico' />
        </Head>

        <Header />

        <main className='relative pl-4 md:pb-24 lg:space-y-24 lg:pl-16'>
          {!hasCatalogue && (
            <p
              role='status'
              className='mr-4 mb-8 rounded-lg bg-white/10 px-4 py-3 text-sm text-white'
            >
              The movie catalogue is temporarily unavailable. Please try again later.
            </p>
          )}

          <Banner netflixOriginals={netflixOriginals} />

          <section className='md:space-y-24'>
            <Row id='trending-now' title='Trending Now' movies={trendingNow} />
            <Row id='top-rated' title='Top Rated' movies={topRated} />
            <Row
              id='action-thrillers'
              title='Action Thrillers'
              movies={actionMovies}
            />
            <Row id='comedies' title='Comedies' movies={comedyMovies} />
            <Row id='horror-movies' title='Horror Movies' movies={horrorMovies} />
            <Row
              id='romance-movies'
              title='Romance Movies'
              movies={romanceMovies}
            />
            <Row
              id='documentaries'
              title='Documentaries'
              movies={documentaries}
            />
          </section>

          <Credits />
        </main>
      </div>

      {searchOpen && <SearchModal trendingNow={trendingNow} />}
      {showModal && <Modal />}
    </>
  );
};

export default Home;

export const getServerSideProps = async () => {
  const { fetchCatalogue } = await import('../lib/tmdb');

  const [
    netflixOriginals,
    trendingNow,
    topRated,
    actionMovies,
    comedyMovies,
    horrorMovies,
    romanceMovies,
    documentaries,
  ] = await Promise.all([
    fetchCatalogue('netflixOriginals'),
    fetchCatalogue('trending'),
    fetchCatalogue('topRated'),
    fetchCatalogue('action'),
    fetchCatalogue('comedy'),
    fetchCatalogue('horror'),
    fetchCatalogue('romance'),
    fetchCatalogue('documentaries'),
  ]);

  return {
    props: {
      netflixOriginals,
      trendingNow,
      topRated,
      actionMovies,
      comedyMovies,
      horrorMovies,
      romanceMovies,
      documentaries,
    },
  };
};
