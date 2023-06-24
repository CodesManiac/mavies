import { CloseCircle } from 'iconsax-react';
import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player/lazy';
import { useRecoilState, useRecoilValue } from 'recoil';
import Swal from 'sweetalert2';
import { modalState, movieState } from '../atoms/modalAtom';
import { Genre, Movie, Element } from '../typings';

const Modal = () => {
  const [showModal, setShowModal] = useRecoilState(modalState);
  const [trailer, setTrailer] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const movie = useRecoilValue(movieState);
  const [muted, setMuted] = useState(false);

  const handleClose = () => {
    setShowModal(false);
  };
  console.log('moviesssss', movie);
  async function fetchMovie() {
    const data = await fetch(
      `https://api.themoviedb.org/3/${
        movie?.media_type === 'tv' ? 'tv' : 'movie'
      }/${movie?.id}?api_key=${
        process.env.NEXT_PUBLIC_API_KEY
      }&language=en-US&append_to_response=videos`
    )
      .then((response) => response.json())
      .catch((error) =>
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Please check your network settings',
          confirmButtonColor: '#34275d',
        })
      );
    console.log('dataaaa isss', data);
    if (data?.videos) {
      console.log('datavideos', data.videos);
      const index = data.videos.results.findIndex(
        (element: Element) => element.type === 'Trailer'
      );
      setTrailer(data.videos?.results[index]?.key);
      console.log('trailer is now', data.videos?.results[index]?.key);
    }
    if (data?.genres) {
      setGenres(data.genres);
    }
  }
  useEffect(() => {
    if (!movie) {
      console.log('there is no movie');
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'There is an error. Please check your network settings',
        confirmButtonColor: '#34275d',
      });
    }

    fetchMovie();
  }, [movie]);

  return (
    <div className='fixed grid place-content-center left-0 bottom-4 right-0 w-full max-w-5xl rounded-lg bg-dark text-white mx-auto top-0 z-40 max-h-screen overflow-hidden overflow-y-scroll scrollbar-hide'>
      <div className=' '>
        <div className='absolute right-5 top-5 z-50 cursor-pointer'>
          <CloseCircle size='32' color='#ffffff' onClick={handleClose} />
        </div>
        <div className='relative pt-[56.25%]'>
          <ReactPlayer
            url={`https://www.youtube.com/watch?v=${trailer}`}
            width='100%'
            height='100%'
            style={{ position: 'absolute', top: '0', left: '0' }}
            playing
            muted={muted}
            controls={true}
          />
        </div>

        <div className='p-4 grid gap-y-2'>
          <div className='flex gap-x-4 text-sm'>
            <p className='text-primary'>{movie!.vote_average * 10}% Match</p>
            <p>{movie!.first_air_date || movie!.release_date}</p>
            <p>HD</p>
          </div>
          <p className='text-sm'>{movie?.overview}</p>
          <p className='text-sm'>
            <span className=''>Genre:</span>{' '}
            {genres.map((genre) => genre.name).join(',')}
          </p>
          <p className='text-sm'>
            <span className=''>Original Language: </span>
            {movie?.original_language}
          </p>
          <p className='text-sm'>
            <span className=''>Total Votes: </span>
            {movie?.vote_count}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Modal;
